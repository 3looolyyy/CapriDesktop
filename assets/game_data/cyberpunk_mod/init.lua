-- Capri companion mod for Cyber Engine Tweaks (Cyberpunk 2077 2.x).
-- Sends game events (combat, kills, health, wanted level, driving, cyberware, quickhacks)
-- to the desktop app and runs its map commands.

local TELEMETRY_URL = "http://127.0.0.1:2077/events"
local lastCombatState = false
local lastHealthPercent = nil
local gameplayTime = 0.0
local lastDeathTime = -100
local lastWantedStars = 0
local lastKillTime = 0
local lastSpeedAlertTime = 0
local lastCrashTime = 0
local lastCyberwareTime = 0
local lastTimeSlowdownAt = -100.0
local SEND_CYBERWARE_EVENT = function() end -- set once sendEvent exists
local pendingSynaptic = nil

-- Cooldown and "ready" effects carry the cyberware's name too, but nothing was activated
local function isCyberwareBookkeeping(effect)
  local e = string.lower(effect or "")
  return e:find("cooldown", 1, true) ~= nil or e:find("ready", 1, true) ~= nil or e:find("recharge", 1, true) ~= nil
end

-- The Synaptic Accelerator only counts once time really slowed down around its status effect
local function checkPendingSynaptic(now)
  if not pendingSynaptic then return end
  local slowed = math.abs(now - lastTimeSlowdownAt) < 1.5
  if not slowed then
    pcall(function() slowed = Game.GetTimeSystem():IsTimeDilationActive() == true end)
  end
  if slowed then
    local effect = pendingSynaptic.effect
    pendingSynaptic = nil
    if now - lastCyberwareTime > 4.0 then
      lastCyberwareTime = now
      print("[CapriCompanion] Synaptic Accelerator activated: " .. effect)
      SEND_CYBERWARE_EVENT({ event = "synaptic_accelerator_activated", effect = effect })
    end
  elseif now - pendingSynaptic.at > 1.5 then
    -- No slowdown: keep the effect name in events.jsonl to tell these apart, without speaking
    print("[CapriCompanion] Synaptic effect without a slowdown, ignored: " .. pendingSynaptic.effect)
    SEND_CYBERWARE_EVENT({ event = "synaptic_effect_ignored", quiet = true, effect = pendingSynaptic.effect })
    pendingSynaptic = nil
  end
end
local lastVehicleSpeed = 0
local lastHackTime = 0
local lastBeingHackedTime = 0
local lastBeingHackedSpecificTime = 0
local lastVehiclePos = nil
local pollTimer = 0.0
local eventSeq = 0

-- Map locations come from the game's own map icons and are cached in capri_locations.json.

local CACHE_FILE = "capri_locations.json"
local DEBUG_FILE = "capri_debug.json"

-- category -> substrings matched against the lowercased gamedataMappinVariant name
local CATEGORY_MATCHERS = {
  ripperdoc = { "ripperdoc" },
  gun_shop  = { "servicepointguns", "gunsmith", "gunshop" },
  bar       = { "servicepointbar" },
  gig       = { "clientindistress", "thievery", "retrieving", "sabotage", "bountyhunt", "smuggling", "searchanddestroy", "gigvariant" },
  tarot     = { "tarot" },
  gang      = { "gangwatch", "outpost" },
  psycho    = { "huntforpsycho" }
}

-- Map icons that come and go (completed gigs, cleared hustles): refreshed every time the world map opens
local DYNAMIC_CATEGORIES = { gig = true, gang = true, psycho = true }

-- Gig variant -> readable gig type + pitch
local GIG_TYPES = {
  { "clientindistress", "Rescue gig", "Some poor choom got snatched and the client is paying to get them out alive. In and out, no casualties on our side!" },
  { "thievery", "Thievery gig", "Something shiny needs a new owner. Sneak in, grab the goods, and vanish before anyone notices." },
  { "retrieving", "Retrieval gig", "A client wants their property back from people who really don't want to give it up. Persuasion or bullets, your call." },
  { "sabotage", "Sabotage gig", "Time to wreck some corpo or gang operation from the inside. Break their toys and walk away clean." },
  { "bountyhunt", "Bounty hunt", "There's a price on someone's head and it might as well be ours. Find the target, flatline or bag them!" },
  { "smuggling", "Smuggling gig", "Hot cargo that needs to cross the city without NCPD sniffing it. Drive smooth, choom." },
  { "searchanddestroy", "Search and destroy gig", "Find the target, wipe it out, collect the eddies. Simple and violent, just how we like it." }
}

local function gigTypeInfo(variant)
  local v = string.lower(variant or "")
  for _, t in ipairs(GIG_TYPES) do
    if string.find(v, t[1], 1, true) then return t[2], t[3] end
  end
  return "Gig", ""
end

local CATEGORY_LABELS = {
  ripperdoc = "Ripperdoc",
  gun_shop = "Gunsmith",
  bar = "Bar",
  gig = "Gig",
  tarot = "Tarot card",
  gang = "NCPD hustle",
  psycho = "Cyberpsycho sighting"
}

-- Gig metadata (no coordinates!) used only to enrich journal entries with fixer/description
local GIGS = {
  { name = "Monster Hunt", district = "Watson (Kabuki)", fixer = "Regina Jones",
    description = "Jotaro Shobo, a high-ranking Tyger Claw boss running cruel BD sweatshops in the Ho-Oh club. Regina wants his head on a spike, or delivered in the trunk of a car. Total scum, choom!" },
  { name = "Woman of La Mancha", district = "Watson (Kabuki)", fixer = "Regina Jones",
    description = "Anna Hamill, an NCPD cop digging way too deep into police corruption. Her own precinct wants her silenced, but Regina wants us to convince her to drop it and get out of town alive." },
  { name = "Hippocratic Oath", district = "Watson (Northside)", fixer = "Regina Jones",
    description = "Maelstrom took a ripperdoc named Lucy hostage to patch up one of their flatlining heavies. Get inside their clinic, flatline the borgs, and escort Lucy out in one piece." },
  { name = "Psychofan", district = "Heywood (The Glen)", fixer = "Sebastian 'Padre' Ibarra",
    description = "Infiltrate the penthouse of an obsessed Kerry Eurodyne collector and steal Kerry's iconic vintage guitar. High security, lasers, and preem music history!" },
  { name = "Eye for an Eye", district = "Heywood (The Glen)", fixer = "Sebastian 'Padre' Ibarra",
    description = "An Arasaka executive ran down a girl and bought her way out with corporate lawyers. Padre says God forgives, but the streets don't." },
  { name = "Olive Branch", district = "Westbrook (Japantown)", fixer = "Wakako Okada",
    description = "Deliver a car to the Tyger Claws as an apology gift. Only surprise: there is somebody locked in the trunk!" },
  { name = "Until Death Do Us Part", district = "Westbrook (Charter Hill)", fixer = "Wakako Okada",
    description = "Break into a luxury penthouse in Charter Hill and steal a shard with juicy divorce dirt before the lawyers notice." },
  { name = "Cuckoo's Nest", district = "Santo Domingo (Rancho Coronado)", fixer = "Muamar 'El Capitán' Reyes",
    description = "A Kang Tao engineer was forcibly checked into a psychiatric asylum to wipe her memory. Break in and get her out before they fry her brain." },
  { name = "Guinea Pigs", district = "City Center (Downtown)", fixer = "Dino Dinovic",
    description = "A ruthless Biotechnica executive poisoned a whole nomad clan during illegal trials. Infiltrate her hotel suite and flatline her." },
  { name = "Radar Love", district = "Badlands", fixer = "Dakota Smith",
    description = "Militech set up a radar tracking nomad convoys. Sneak in, steal the transmitter, and get out clean." }
}

local locationCache = { ripperdoc = {}, gun_shop = {}, bar = {}, gig = {}, tarot = {}, gang = {}, psycho = {} }
local lastWorldMapHookAt = -1000
local seenVariants = {}
local unsafeSteps = {}
local hookStatus = {}
local journalDump = {}
local cacheDirty = false
local cacheSaveTimer = 0.0

local activePoiMappins = {}
local lastProcessedCommandId = 0
local commandPollTimer = 0.0

local function normalizeCategory(category)
  local c = string.lower(tostring(category or "ripperdoc"))
  if c == "gun_shop" or c == "gunsmith" or c == "weapons" or c == "armeria" then return "gun_shop" end
  if c == "bar" or c == "club" then return "bar" end
  if c == "tarot" then return "tarot" end
  if c == "gig" then return "gig" end
  if c == "gang" or c == "gangs" or c == "hustle" or c == "ncpd" then return "gang" end
  if c == "psycho" or c == "cyberpsycho" then return "psycho" end
  return "ripperdoc"
end

local function loadCache()
  local f = io.open(CACHE_FILE, "r")
  if not f then return end
  local raw = f:read("*a")
  f:close()
  if not raw or raw == "" then return end
  local ok, data = pcall(function() return json.decode(raw) end)
  if ok and type(data) == "table" then
    for cat, list in pairs(data) do
      if type(list) == "table" then locationCache[cat] = list end
    end
  end
end

local function saveCache()
  local ok, str = pcall(function() return json.encode(locationCache) end)
  if not ok or not str then return end
  local f = io.open(CACHE_FILE, "w")
  if f then
    f:write(str)
    f:close()
  end
  cacheDirty = false
end

local function cacheCounts()
  local counts = {}
  for cat, list in pairs(locationCache) do counts[cat] = #list end
  return counts
end

local function writeDebug()
  local variantList = {}
  for vName, n in pairs(seenVariants) do table.insert(variantList, vName .. " x" .. n) end
  local data = {
    counts = cacheCounts(),
    variantsSeen = variantList,
    unsafe = unsafeSteps,
    hooks = hookStatus,
    journalQuests = journalDump
  }
  local ok, str = pcall(function() return json.encode(data) end)
  if not ok or not str then return end
  local f = io.open(DEBUG_FILE, "w")
  if f then
    f:write(str)
    f:close()
  end
end

local function addLocation(cat, x, y, z, name, source, variant)
  local list = locationCache[cat]
  if not list then
    list = {}
    locationCache[cat] = list
  end
  for _, loc in ipairs(list) do
    local dx, dy = loc.x - x, loc.y - y
    if dx * dx + dy * dy < 15 * 15 then
      if name and name ~= "" and loc.name ~= name then
        loc.name = name
        cacheDirty = true
      end
      return loc
    end
  end
  local loc = { x = x, y = y, z = z, name = name, source = source, variant = variant }
  table.insert(list, loc)
  cacheDirty = true
  return loc
end

local function variantName(v)
  local s = nil
  pcall(function() s = EnumValueToString("gamedataMappinVariant", EnumInt(v)) end)
  if not s or s == "" then s = tostring(v) end
  return s or "?"
end

local function classifyVariant(vName)
  local s = string.lower(vName or "")
  for cat, pats in pairs(CATEGORY_MATCHERS) do
    for _, p in ipairs(pats) do
      if string.find(s, p, 1, true) then return cat end
    end
  end
  return nil
end

local function localize(n)
  if not n or n == "" then return nil end
  local okL, loc = pcall(function() return Game.GetLocalizedText(n) end)
  if okL and loc and loc ~= "" then return loc end
  return tostring(n)
end

local function recordMappin(mappin, source, ctrl)
  if not mappin then return end
  local okV, v = pcall(function() return mappin:GetVariant() end)
  if not okV or v == nil then return end
  local okP, pos = pcall(function() return mappin:GetWorldPosition() end)
  if not okP or not pos then return end
  if math.abs(pos.x) < 0.01 and math.abs(pos.y) < 0.01 then return end

  local vName = variantName(v)
  if not seenVariants[vName] then cacheDirty = true end -- new icon type: refresh capri_debug.json
  seenVariants[vName] = (seenVariants[vName] or 0) + 1
  local cat = classifyVariant(vName)
  if not cat then return end

  if source and string.find(source, "BaseWorldMap", 1, true) then
    local now = os.clock()
    if now - lastWorldMapHookAt > 20.0 then
      -- Fresh map open: drop gigs/hustles that may have been completed since last time
      for dc, _ in pairs(DYNAMIC_CATEGORIES) do locationCache[dc] = {} end
      cacheDirty = true
    end
    lastWorldMapHookAt = now
  end

  local name = nil
  pcall(function() name = localize(mappin:GetDisplayName()) end)
  if not name and ctrl then
    pcall(function() name = localize(ctrl:GetDisplayName()) end)
  end
  addLocation(cat, pos.x, pos.y, pos.z, name, source, vName)
end

local function mappinFromController(ctrl)
  local m = nil
  pcall(function() m = ctrl:GetMappin() end)
  if not m then pcall(function() m = ctrl.mappin end) end
  return m
end

-- Must be called from onInit (Observe* only works there)
local HOOK_TARGETS = {
  { "BaseWorldMapMappinController", "OnIntro" },
  { "BaseWorldMapMappinController", "UpdateRootState" },
  { "BaseMappinBaseController", "OnIntro" },
  { "MinimapPOIMappinController", "OnIntro" },
  { "MinimapQuestMappinController", "OnIntro" }
}

local function installMappinHooks()
  for _, t in ipairs(HOOK_TARGETS) do
    local cls, fn = t[1], t[2]
    local key = cls .. "." .. fn
    local ok, err = pcall(function()
      ObserveAfter(cls, fn, function(self)
        pcall(function()
          if not hookStatus[key .. "#fired"] then hookStatus[key .. "#fired"] = true end
          recordMappin(mappinFromController(self), key, self)
        end)
      end)
    end)
    hookStatus[key] = ok and "registered" or tostring(err)
  end
end

-- Best-effort direct query of the mappin system (API availability varies by game version)
local function activeScan()
  local ms = Game.GetMappinSystem()
  if not ms then return 0 end
  local found = 0
  for _, tt in ipairs({ "Map", "Mappin3D", "Minimap" }) do
    pcall(function()
      local entries = ms:GetMappins(Enum.new("gamemappinsMappinTargetType", tt))
      if entries then
        for _, e in ipairs(entries) do
          local m = nil
          pcall(function() m = e.mappin end)
          if not m then pcall(function() m = ms:GetMappin(e.id) end) end
          if m then
            recordMappin(m, "scan:" .. tt)
            found = found + 1
          end
        end
      end
    end)
  end
  hookStatus["activeScan"] = found
  return found
end

local function distTo(pPos, loc)
  local dx = pPos.x - loc.x
  local dy = pPos.y - loc.y
  local dz = pPos.z - (loc.z or pPos.z)
  return math.sqrt(dx * dx + dy * dy + dz * dz)
end

local function findNearest(cat, pPos)
  local best, bestD = nil, math.huge
  for _, loc in ipairs(locationCache[cat] or {}) do
    local d = distTo(pPos, loc)
    if d < bestD then
      best, bestD = loc, d
    end
  end
  return best, bestD
end

local function unregisterActiveMappins()
  local ms = Game.GetMappinSystem()
  if not ms then return end
  for _, mId in ipairs(activePoiMappins) do
    pcall(function()
      ms:UnregisterMappin(mId)
    end)
  end
  activePoiMappins = {}
end

local function placeWaypoint(x, y, z)
  unregisterActiveMappins()
  local ms = Game.GetMappinSystem()
  if not ms then return false end
  local placed = false
  pcall(function()
    local mData = NewObject("gamemappinsMappinData")
    mData.mappinType = TweakDBID.new("Mappins.DefaultStaticMappin")
    mData.variant = Enum.new("gamedataMappinVariant", "CustomPositionVariant")
    mData.visibleThroughWalls = true
    pcall(function() mData.visibleIn3D = true end)
    pcall(function() mData.visibleInMiniMap = true end)
    pcall(function() mData.visibleOnWorldMap = true end)

    local mappinId = ms:RegisterMappin(mData, Vector4.new(x, y, z, 1.0))
    if mappinId then
      table.insert(activePoiMappins, mappinId)
      placed = true
      pcall(function() ms:SetMappinTracked(mappinId, true) end)
      pcall(function() ms:TrackMappin(mappinId) end)
    end
  end)
  return placed
end

local function sendEvent(eventData)
  eventData.timestamp = os.time() * 1000
  eventSeq = (eventSeq or 0) + 1
  eventData.seq = eventSeq

  local jsonStr = json.encode(eventData)

  -- Write latest snapshot to telemetry.json
  local targetPaths = {
    "bin/x64/plugins/cyber_engine_tweaks/mods/capri/telemetry.json",
    "plugins/cyber_engine_tweaks/mods/capri/telemetry.json",
    "telemetry.json"
  }
  for _, p in ipairs(targetPaths) do
    local f = io.open(p, "w")
    if f then
      f:write(jsonStr)
      f:close()
    end
  end

  -- Append to events.jsonl queue (guarantees zero missed events)
  local logPaths = {
    "bin/x64/plugins/cyber_engine_tweaks/mods/capri/events.jsonl",
    "plugins/cyber_engine_tweaks/mods/capri/events.jsonl",
    "events.jsonl"
  }
  for _, lp in ipairs(logPaths) do
    local lf = io.open(lp, "a")
    if lf then
      lf:write(jsonStr .. "\n")
      lf:close()
    end
  end

  -- Optional Async HTTP (if an HTTP extension is present in CET)
  if HttpRequest and HttpRequest.Post then
    pcall(function()
      HttpRequest.Post(TELEMETRY_URL, jsonStr, { ["Content-Type"] = "application/json" })
    end)
  end
end

local function showHud(text, duration)
  pcall(function()
    local msg = SimpleScreenMessage.new()
    msg.message = text
    msg.duration = duration or 5.0
    msg.isShown = true

    local bbDefs = GetAllBlackboardDefs()
    if bbDefs and bbDefs.UI_Notifications then
      local bb = Game.GetBlackboardSystem():Get(bbDefs.UI_Notifications)
      if bb then
        bb:SetVariant(bbDefs.UI_Notifications.OnscreenMessage, ToVariant(msg), true)
      end
    end
  end)
  -- Red centered warning banner (the "[capri] ... // ..." look)
  pcall(function()
    local player = Game.GetPlayer()
    if player and player.SetWarningMessage then
      player:SetWarningMessage(text)
    end
  end)
end

SEND_CYBERWARE_EVENT = sendEvent

local function markClosestLocation(category, nameFilter, quiet)
  local cat = normalizeCategory(category)
  local label = CATEGORY_LABELS[cat] or cat
  local player = Game.GetPlayer()
  if not player then return false end
  local pPos = player:GetWorldPosition()
  if not pPos then return false end

  activeScan()
  local best, minDist = nil, nil
  if nameFilter and nameFilter ~= "" then
    local needle = string.lower(nameFilter)
    for _, loc in ipairs(locationCache[cat] or {}) do
      if loc.name and string.find(string.lower(loc.name), needle, 1, true) then
        local d = distTo(pPos, loc)
        if not minDist or d < minDist then best, minDist = loc, d end
      end
    end
  end
  if not best then
    best, minDist = findNearest(cat, pPos)
  end

  if not best then
    writeDebug()
    local hint = "I haven't read any " .. label .. " icons from your map yet. Open the world map (M) once so I can sync them, then ask me again."
    showHud("[CAPRI] " .. hint, 7.0)
    sendEvent({ event = "poi_not_found", quiet = quiet, category = cat, customPhrase = hint })
    print("[CapriCompanion] No cached locations for category " .. cat)
    return false
  end

  placeWaypoint(best.x, best.y, best.z)

  local name = (best.name and best.name ~= "") and best.name or label
  local hudText = "[CAPRI] " .. string.upper(label) .. " // " .. name .. " (" .. math.floor(minDist) .. "m)"
  if name == label then
    hudText = "[CAPRI] " .. string.upper(label) .. " // " .. math.floor(minDist) .. "m"
  end
  showHud(hudText, 5.0)

  sendEvent({
    event = (cat == "tarot") and "tarot_marked" or "poi_marked",
    quiet = quiet,
    category = cat,
    name = name,
    district = best.district,
    distance = math.floor(minDist)
  })

  print(string.format("[CapriCompanion] POI Marked: %s [%s] at %dm (%.1f, %.1f, %.1f)", name, cat, math.floor(minDist), best.x, best.y, best.z))
  return true
end

-- Journal helpers (gigs / missions)
-- Some native journal calls can hard-crash the game (pcall can't catch that).
-- Every risky call writes a breadcrumb first; if the game dies mid-call, the next
-- session reads the breadcrumb and permanently skips that step (capri_unsafe.json).

local CRUMB_FILE = "capri_crumb.txt"
local UNSAFE_FILE = "capri_unsafe.json"

local function loadUnsafe()
  local f = io.open(UNSAFE_FILE, "r")
  if f then
    local raw = f:read("*a")
    f:close()
    local ok, data = pcall(function() return json.decode(raw) end)
    if ok and type(data) == "table" then unsafeSteps = data end
  end
  -- A leftover breadcrumb means the game crashed inside that step last time
  local c = io.open(CRUMB_FILE, "r")
  if c then
    local step = c:read("*a")
    c:close()
    if step and step ~= "" then
      unsafeSteps[step] = true
      print("[CapriCompanion] Previous session crashed in journal step '" .. step .. "', disabling it.")
      local w = io.open(UNSAFE_FILE, "w")
      if w then
        w:write(json.encode(unsafeSteps))
        w:close()
      end
    end
  end
  local clr = io.open(CRUMB_FILE, "w")
  if clr then clr:write("") clr:close() end
end

local function crumb(step)
  local f = io.open(CRUMB_FILE, "w")
  if f then
    f:write(step or "")
    f:close()
  end
end

-- Runs fn only if `step` never crashed before. Returns ok, result...
local unpackFn = table.unpack or unpack
local function guarded(step, fn)
  if unsafeSteps[step] then return false, nil end
  crumb(step)
  local res = { pcall(fn) }
  crumb("")
  return unpackFn(res)
end

local function newFilter(active, inactive, succeeded, failed)
  local f = JournalRequestStateFilter.new()
  f.active = active
  f.inactive = inactive
  f.succeeded = succeeded
  f.failed = failed
  return f
end

-- CET returns `out` params as return values; accept either position
local function asList(a, b)
  if type(b) == "table" then return b end
  if type(a) == "table" then return a end
  return {}
end

local function entryState(jm, e)
  local ok, s = guarded("GetEntryState", function() return jm:GetEntryState(e) end)
  if not ok or s == nil then return "unknown" end
  local str = tostring(s)
  if str:find("Inactive") or s == 1 then return "inactive" end
  if str:find("Succeeded") or s == 3 then return "completed" end
  if str:find("Failed") or s == 4 then return "failed" end
  if str:find("Active") or s == 2 then return "active" end
  return "unknown"
end

local function entryTitle(jm, e)
  local ok, t = guarded("GetTitle", function() return e:GetTitle(jm) end)
  if not ok or not t or t == "" then return nil end
  local okL, loc = pcall(function() return Game.GetLocalizedText(t) end)
  if okL and loc and loc ~= "" then return loc end
  return tostring(t)
end

local function isObjective(e)
  local ok, yes = guarded("IsA", function() return e:IsA("gameJournalQuestObjective") end)
  return ok and yes == true
end

local function getChildren(jm, e)
  local ok, a, b = guarded("GetChildren", function() return jm:GetChildren(e, newFilter(true, false, false, false)) end)
  if not ok then return {} end
  return asList(a, b)
end

-- quest -> phase -> objective (2 levels is enough for the journal layout)
local function findActiveObjective(jm, quest)
  for _, phase in ipairs(getChildren(jm, quest)) do
    if isObjective(phase) then return phase end
    for _, obj in ipairs(getChildren(jm, phase)) do
      if isObjective(obj) then return obj end
    end
  end
  return nil
end

local function questKind(qType, qId)
  if qType:find("StreetStory") or qType:find("Contract") or qId:find("^sts_") then return "gig" end
  if qType:find("MainQuest") or qType:find("SideQuest") or qId:find("^q%d") or qId:find("^sq%d") or qId:find("^mq%d") then return "mission" end
  return "other"
end

local function listJournalQuests()
  local jm = Game.GetJournalManager()
  local out = {}
  journalDump = {}
  if not jm then return out end

  if true then return out end -- GetQuests crashes the game; disabled
  local ok, a, b = guarded("GetQuests", function() return jm:GetQuests(newFilter(true, false, false, false)) end)
  local quests = ok and asList(a, b) or {}
  hookStatus["journalQuests"] = #quests

  for _, q in ipairs(quests) do
    local qType, qId = "", ""
    local okT, t = guarded("GetType", function() return tostring(q:GetType()) end)
    if okT and t then qType = t end
    local okI, i = guarded("GetId", function() return tostring(q:GetId()) end)
    if okI and i then qId = i end
    local title = entryTitle(jm, q)
    local kind = questKind(qType, qId)
    if #journalDump < 120 then
      table.insert(journalDump, { id = qId, type = qType, kind = kind, title = title })
    end
    local isMain = qType:find("MainQuest") ~= nil or qId:find("^q%d") ~= nil
    table.insert(out, { entry = q, id = qId, title = title or qId, kind = kind, main = isMain })
  end
  return out
end

local function gigMeta(title)
  local t = string.lower(title or "")
  for _, g in ipairs(GIGS) do
    if string.lower(g.name) == t then return g end
  end
  return nil
end

local function emitQuest(name, kind, status, distance, source, quiet)
  local meta = gigMeta(name) or {}
  sendEvent({
    event = "gig_marked",
    quiet = quiet,
    kind = kind,
    name = name,
    district = meta.district,
    fixer = meta.fixer,
    description = meta.description or "",
    distance = distance,
    status = status,
    source = source
  })
end

local function shuffle(t)
  for i = #t, 2, -1 do
    local j = math.random(i)
    t[i], t[j] = t[j], t[i]
  end
  return t
end

local function getTrackedQuest(jm)
  if not jm then return nil end
  local okT, obj = guarded("GetTrackedEntry", function() return jm:GetTrackedEntry() end)
  if not okT or not obj then return nil end

  -- Walk objective -> phase -> quest
  local quest = obj
  for _ = 1, 5 do
    local okQ, isQuest = guarded("IsAQuest", function() return quest:IsA("gameJournalQuest") end)
    if okQ and isQuest then break end
    local okP, parent = guarded("GetParentEntry", function() return jm:GetParentEntry(quest) end)
    if not okP or not parent then break end
    quest = parent
  end

  local title = entryTitle(jm, quest) or entryTitle(jm, obj)
  if not title or title == "" then return nil end
  local qType, qId = "", ""
  local okTy, t = guarded("GetType", function() return tostring(quest:GetType()) end)
  if okTy and t then qType = t end
  local okI, i = guarded("GetId", function() return tostring(quest:GetId()) end)
  if okI and i then qId = i end
  local kind = questKind(qType, qId)
  hookStatus["trackedQuest"] = { title = title, type = qType, id = qId, kind = kind }
  return { title = title, kind = kind, main = qType:find("MainQuest") ~= nil or qId:find("^q%d") ~= nil }
end

-- kind: "gig" | "mission" | "any"
local function recommendQuest(kind, preferredDistrict, quiet)
  kind = kind or "gig"
  local player = Game.GetPlayer()
  local pPos = player and player:GetWorldPosition() or nil
  local jm = Game.GetJournalManager()

  -- The quest the player is currently tracking.
  -- NOTE: JournalManager:GetQuests() hard-crashes the game from CET, so we never enumerate
  -- the journal. GetTrackedEntry/GetParentEntry are the same calls the vanilla HUD uses.
  local tracked = getTrackedQuest(jm)
  if tracked then
    local fits = (kind == "any")
      or (kind == "gig" and tracked.kind == "gig")
      or ((kind == "mission" or kind == "main") and tracked.kind ~= "gig")
    if fits then
      local label = (tracked.kind == "gig") and "GIG" or "MISSION"
      showHud("[CAPRI] " .. label .. " // " .. tracked.title, 6.0)
      emitQuest(tracked.title, tracked.kind == "gig" and "gig" or "mission", "tracked", nil, "journal", quiet)
      print("[CapriCompanion] Recommending tracked quest: " .. tracked.title .. " [" .. tracked.kind .. "]")
      return true
    end
  end

  -- Nearest gig icon cached from the map (if the map was ever opened)
  activeScan()
  if pPos and kind ~= "mission" and kind ~= "main" then
    local list = {}
    for _, loc in ipairs(locationCache["gig"] or {}) do
      table.insert(list, { loc = loc, d = distTo(pPos, loc) })
    end
    table.sort(list, function(x, y) return x.d < y.d end)
    if #list > 0 then
      local pick = list[math.random(math.min(5, #list))]
      local best, d = pick.loc, pick.d
      placeWaypoint(best.x, best.y, best.z)
      local typeName, pitch = gigTypeInfo(best.variant)
      local name = (best.name and best.name ~= "") and best.name or typeName
      showHud("[CAPRI] GIG // " .. name .. " (" .. math.floor(d) .. "m)", 6.0)
      sendEvent({
        event = "gig_marked",
        quiet = quiet,
        kind = "gig",
        name = name,
        description = pitch,
        distance = math.floor(d),
        status = "available",
        source = "map"
      })
      writeDebug()
      return true
    end
  end

  -- Nothing usable
  writeDebug()
  local hint = "I couldn't find any active " .. ((kind == "mission" or kind == "main") and "mission" or "gig") .. " in your journal right now, choom. Check your messages, a fixer might have one waiting."
  if quiet then
    -- The app will suggest something else itself; just report back
    sendEvent({ event = "gig_not_found", kind = kind, quiet = true })
  else
    showHud("[CAPRI] " .. hint, 7.0)
    sendEvent({ event = "gig_not_found", kind = kind, customPhrase = hint })
  end
  print("[CapriCompanion] No tracked quest matching kind " .. tostring(kind))
  return false
end

-- Console API:  Capri = GetMod("capri")  then  Capri.dump() / Capri.remember("tarot", "The Fool")
local Capri = {}

function Capri.remember(category, name)
  local player = Game.GetPlayer()
  if not player then return end
  local p = player:GetWorldPosition()
  local cat = normalizeCategory(category)
  local loc = addLocation(cat, p.x, p.y, p.z, name, "manual")
  if name and name ~= "" then loc.name = name end
  saveCache()
  print(string.format("[CapriCompanion] Saved %s '%s' at (%.1f, %.1f, %.1f)", cat, tostring(name), p.x, p.y, p.z))
end

function Capri.dump()
  activeScan()
  pcall(function() getTrackedQuest(Game.GetJournalManager()) end)
  saveCache()
  writeDebug()
  for cat, n in pairs(cacheCounts()) do
    print("[CapriCompanion] cached " .. cat .. ": " .. n)
  end
  for k, v in pairs(hookStatus) do
    print("[CapriCompanion] hook " .. k .. " = " .. tostring(v))
  end
end

function Capri.clear(category)
  if category then
    locationCache[normalizeCategory(category)] = {}
  else
    locationCache = { ripperdoc = {}, gun_shop = {}, bar = {}, gig = {}, tarot = {}, gang = {}, psycho = {} }
  end
  saveCache()
end

local function tickCacheSave(dt)
  cacheSaveTimer = cacheSaveTimer + dt
  if cacheSaveTimer < 5.0 then return end
  cacheSaveTimer = 0.0
  if cacheDirty then
    saveCache()
    writeDebug()
  end
end

local function checkCommands(dt)
  commandPollTimer = commandPollTimer + dt
  if commandPollTimer < 0.35 then return end
  commandPollTimer = 0.0

  local commandPaths = {
    "bin/x64/plugins/cyber_engine_tweaks/mods/capri/commands.json",
    "plugins/cyber_engine_tweaks/mods/capri/commands.json",
    "commands.json"
  }

  for _, cp in ipairs(commandPaths) do
    local f = io.open(cp, "r")
    if f then
      local raw = f:read("*a")
      f:close()
      if raw and raw ~= "" then
        local ok, cmd = pcall(function() return json.decode(raw) end)
        -- Ignore stale commands left over from a previous session (e.g. after a crash)
        local stale = ok and cmd and cmd.timestamp and math.abs(os.time() - math.floor(cmd.timestamp / 1000)) > 30
        if stale then
          lastProcessedCommandId = cmd.id
          print("[CapriCompanion] Dropping stale command: " .. tostring(cmd.action))
        end
        if ok and cmd and cmd.id and cmd.id ~= lastProcessedCommandId then
          lastProcessedCommandId = cmd.id
          print("[CapriCompanion] Executing command: " .. tostring(cmd.action) .. " (" .. tostring(cmd.target) .. ")")
          
          if cmd.action == "recommend_gig" or cmd.action == "mark_gig" then
            -- Gig positions are always resolved in-game
            recommendQuest(cmd.kind or "gig", cmd.district, cmd.quiet)
          elseif cmd.action == "recommend_next" then
            recommendQuest(cmd.kind or "any", cmd.district, cmd.quiet)
          elseif cmd.action == "mark_closest" then
            markClosestLocation(cmd.target or "ripperdoc", cmd.name, cmd.quiet)
          elseif cmd.action == "mark_tarot" then
            markClosestLocation("tarot")
          elseif cmd.action == "debug_dump" then
            Capri.dump()
          elseif cmd.action == "clear_marker" then
            unregisterActiveMappins()
          end

          -- Clear processed command
          local fClear = io.open(cp, "w")
          if fClear then
            fClear:write("")
            fClear:close()
          end
          break
        end
      end
    end
  end
end

-- Quickhack identification (record IDs, status effects, and localized EN/ES titles)
local HACK_KEYWORDS = {
  { "cyberware_malfunction", { "cyberwaremalfunction", "cyberware malfunction", "disablecyberware", "hackcyberware", "malfunctionhack", "fallo de ciberware", "fallo del ciberware", "averia de ciberware" } },
  { "weapon_glitch", { "weaponmalfunction", "weapon malfunction", "weaponglitch", "weapon glitch", "hackweapon", "fallo de arma", "fallo del arma", "falla de arma" } },
  { "locomotion_malfunction", { "locomotion", "cripple", "paraliz", "movimiento" } },
  { "short_circuit", { "shortcircuit", "short circuit", "empoverload", "cortocircuito" } },
  { "overheat", { "overheat", "sobrecalent" } },
  { "contagion", { "contagion", "contagio" } },
  { "synapse_burnout", { "synapse", "brainmelt", "sinap" } },
  { "system_collapse", { "systemcollapse", "system collapse", "systemreset", "system reset", "colapso", "reinicio del sistema" } },
  { "reboot_optics", { "rebootoptics", "reboot optics", "blind", "optica", "óptica" } },
  { "memory_wipe", { "memorywipe", "memory wipe", "borrado de memoria" } },
  { "cyberpsychosis", { "cyberpsychosis", "madness", "ciberpsicosis" } },
  { "suicide", { "suicide", "suicidio" } },
  { "ping", { "statuseffect.ping", "pinghack", "hackping", "ping" } },
  { "blackwall", { "blackwall", "canto", "erebus" } },
  { "trace", { "hackreveal", "reveal", "trace", "rastre" } },
  { "detonate_grenade", { "grenade", "granada" } },
  { "distract", { "distract", "distrac" } }
}

local function classifyHack(str)
  local s = string.lower(str or "")
  for _, entry in ipairs(HACK_KEYWORDS) do
    for _, kw in ipairs(entry[2]) do
      if string.find(s, kw, 1, true) then return entry[1] end
    end
  end
  return nil
end

local pendingHackAt = nil

local function emitPlayerHack(hackType, effect, source)
  local now = os.clock()
  pendingHackAt = nil
  if now - lastHackTime < 4.0 then return end
  lastHackTime = now
  print("[CapriCompanion] Player quickhack: " .. tostring(hackType) .. " via " .. tostring(source) .. " (" .. tostring(effect) .. ")")
  sendEvent({
    event = "player_quickhack",
    hack = hackType,
    effect = effect
  })
end

registerForEvent("onInit", function()
  print("[CapriCompanion] Cyberpunk 2077 CET Telemetry mod v2.3 initialized successfully!")

  -- Location discovery: load cached real positions + hook map icons
  pcall(loadCache)
  pcall(loadUnsafe)
  pcall(installMappinHooks)
  pcall(function() math.randomseed(os.time()) end)

  -- Hook NPC and Player Deaths
  pcall(function()
    ObserveAfter("ScriptedPuppet", "OnDeath", function(self, evt)
      if not self then return end

      if self:IsPlayer() then
        local now = os.clock()
        if gameplayTime < 15.0 or now - lastDeathTime < 10.0 then return end
        lastDeathTime = now
        print("[CapriCompanion] Player flatlined!")
        sendEvent({
          event = "player_died",
          killer = "hostile"
        })
      else
        local now = os.clock()
        if gameplayTime >= 15.0 and now - lastKillTime > 0.20 then
          lastKillTime = now
          local victimName = "hostile"
          local gang = "unknown"
          local isCiv = false

          pcall(function()
            local name = self:GetDisplayFullDisplayName()
            if name and name ~= "" then
              victimName = tostring(name)
            end
          end)

          pcall(function()
            if self.IsCivilian and self:IsCivilian() then isCiv = true end
            if self.IsCharacterCivilian and self:IsCharacterCivilian() then isCiv = true end
            if self.IsCrowd and self:IsCrowd() then isCiv = true end
            local rec = self:GetRecord()
            if rec then
              local aff = rec:Affiliation()
              if aff then
                local aType = tostring(aff:Type() or "")
                if aType ~= "" then gang = aType end
              end
            end
          end)

          local gLower = tostring(gang):lower()
          -- Detect civilian kill vs gang/hostile kill
          if isCiv or gLower:find("civilian") or gLower:find("citizen") or gLower:find("crowd") or gLower:find("unaffiliated") then
            print("[CapriCompanion] Civilian killed: " .. victimName)
            sendEvent({
              event = "civilian_killed",
              victim = victimName
            })
          else
            print("[CapriCompanion] Kill confirmed: " .. victimName .. " (" .. gang .. ")")
            sendEvent({
              event = "player_kill",
              victim = victimName,
              gang = gang
            })
          end
        end
      end
    end)
  end)

  -- Hook Player Input Actions (Quickhacks, Sandevistan, Berserk, Overclock)
  pcall(function()
    ObserveBefore("PlayerPuppet", "OnAction", function(self, action)
      pcall(function()
        if not action then return end
        local aName = Game.NameToString(ListenerAction.GetName(action))
        local aType = tostring(ListenerAction.GetType(action).value or "")
        if aType == "BUTTON_PRESSED" then
          local now = os.clock()
          if aName:find("Overclock") then
            if now - lastCyberwareTime > 6.0 then
              lastCyberwareTime = now
              print("[CapriCompanion] Overclock action: " .. aName)
              sendEvent({ event = "overclock_activated" })
            end
          elseif aName:find("Sandevistan") then
            if now - lastCyberwareTime > 6.0 then
              lastCyberwareTime = now
              print("[CapriCompanion] Sandevistan action: " .. aName)
              sendEvent({ event = "sandevistan_activated" })
            end
          elseif aName:find("Berserk") then
            if now - lastCyberwareTime > 6.0 then
              lastCyberwareTime = now
              print("[CapriCompanion] Berserk action: " .. aName)
              sendEvent({ event = "berserk_activated" })
            end
          elseif aName == "ExecuteQuickHack" then
            -- Don't speak yet: wait briefly for the specific hack (menu / status effect) to arrive
            if now - lastHackTime > 4.0 then
              pendingHackAt = now
            end
          end
        end
      end)
    end)
  end)

  -- Hook Time Dilation (Sandevistan, Kerenzikov, Synaptic Accelerator)
  pcall(function()
    Observe("TimeSystem", "SetTimeDilation", function(self, reason, value)
      pcall(function()
        local rStr = tostring(reason or ""):lower()
        local now = os.clock()
        if type(value) == "number" and value < 1.0 then lastTimeSlowdownAt = now end
        if isCyberwareBookkeeping(rStr) then return end
        if now - lastCyberwareTime < 4.0 then return end

        if rStr:find("kerenzikov") or rStr:find("kereznikov") then
          lastCyberwareTime = now
          print("[CapriCompanion] Kerenzikov time dilation: " .. rStr)
          sendEvent({ event = "kerenzikov_activated" })
        elseif rStr:find("synaptic") then
          lastCyberwareTime = now
          print("[CapriCompanion] Synaptic Accelerator time dilation: " .. rStr)
          sendEvent({ event = "synaptic_accelerator_activated" })
        elseif rStr:find("sandevistan") then
          lastCyberwareTime = now
          print("[CapriCompanion] Sandevistan activated via TimeSystem: " .. rStr)
          sendEvent({ event = "sandevistan_activated" })
        end
      end)
    end)
  end)

  -- Hook Status Effect Applied on both PlayerPuppet and ScriptedPuppet NPCs
  pcall(function()
    ObserveAfter("ScriptedPuppet", "OnStatusEffectApplied", function(self, evt)
      pcall(function()
        if not evt or not evt.staticData then return end
        local rId = evt.staticData:GetID()
        local effId = tostring(rId or "")
        pcall(function()
          if TDBID and TDBID.ToStringDEBUG then
            effId = effId .. " " .. TDBID.ToStringDEBUG(rId)
          end
        end)

        local isPlayer = false
        pcall(function() isPlayer = self:IsPlayer() end)
        local now = os.clock()
        local effLower = effId:lower()

        if isPlayer then
          local isCyberware = effLower:find("kerenzikov") or effLower:find("kereznikov") or effLower:find("synaptic")
            or effLower:find("sandevistan") or effLower:find("overclock") or effLower:find("berserk")
          if isCyberware and isCyberwareBookkeeping(effLower) then return end

          -- Status applied to player: cyberware buffs or enemy hacks
          if effLower:find("kerenzikov") or effLower:find("kereznikov") then
            if now - lastCyberwareTime > 4.0 then
              lastCyberwareTime = now
              print("[CapriCompanion] Kerenzikov status effect: " .. effId)
              sendEvent({ event = "kerenzikov_activated" })
            end
          elseif effLower:find("synaptic") then
            pendingSynaptic = { at = now, effect = effId }
          elseif effLower:find("sandevistan") then
            if now - lastCyberwareTime > 5.0 then
              lastCyberwareTime = now
              print("[CapriCompanion] Sandevistan status effect: " .. effId)
              sendEvent({ event = "sandevistan_activated" })
            end
          elseif effLower:find("overclock") then
            if now - lastCyberwareTime > 5.0 then
              lastCyberwareTime = now
              print("[CapriCompanion] Overclock status effect: " .. effId)
              sendEvent({ event = "overclock_activated" })
            end
          elseif effLower:find("berserk") then
            if now - lastCyberwareTime > 5.0 then
              lastCyberwareTime = now
              print("[CapriCompanion] Berserk status effect: " .. effId)
              sendEvent({ event = "berserk_activated" })
            end
          else
            -- Enemy netrunner hacking V: only real enemy quickhack effects (AIQuickHackStatusEffect.*),
            -- never plain fire / poison / grenades, never "interrupted" bookkeeping effects.
            local isBeingHacked = effLower:find("aiquickhack") ~= nil
              and effLower:find("interrupted") == nil
            local specific = isBeingHacked and classifyHack(effLower) or nil
            local hackReceived = specific or "netrunner_hack"

            -- The generic "upload started" effect (BeingHacked) arrives first; the specific hack
            -- (HackOverheat, HackBlind...) lands seconds later and must not be swallowed by it.
            local allowed = false
            if isBeingHacked then
              if specific then
                allowed = now - lastBeingHackedSpecificTime > 6.0
                if allowed then lastBeingHackedSpecificTime = now end
              else
                allowed = now - lastBeingHackedTime > 10.0
              end
            end

            if allowed then
              if true then
                lastBeingHackedTime = now
                print("[CapriCompanion] Enemy netrunner uploading hack to V: " .. hackReceived .. " (" .. effId .. ")")
                sendEvent({
                  event = "player_being_hacked",
                  hack = hackReceived,
                  effect = effId
                })
              end
            end
          end
        else
          -- Status applied to NPC target: verify V is the instigator and identify specific quickhack
          local isPlayerInstigator = false
          local noInstigator = false
          pcall(function()
            local player = Game.GetPlayer()
            local inst = evt.instigator
            if not inst and evt.GetInstigator then inst = evt:GetInstigator() end
            if not inst then noInstigator = true end
            if inst and player then
              if inst == player or (inst.IsPlayer and inst:IsPlayer()) or (inst.GetEntityID and player.GetEntityID and inst:GetEntityID().hash == player:GetEntityID().hash) then
                isPlayerInstigator = true
              end
            end
          end)

          -- V started uploading a hack onto this NPC: wait for the specific effect to land
          if effLower:find("aiquickhackstatuseffect.beinghacked", 1, true) then
            if now - lastHackTime > 4.0 and not pendingHackAt then pendingHackAt = now end
            return
          end

          -- Enemy-netrunner / bookkeeping effects are never V's hacks
          if effLower:find("aiquickhack") or effLower:find("interrupted") or effLower:find("wasquickhacked") then
            return
          end

          local hackType = classifyHack(effLower)
          -- Only real hack effects here ("ping" substring etc. can appear in unrelated effect names)
          if hackType == "ping" and not effLower:find("statuseffect.ping", 1, true) then hackType = nil end
          if hackType == "detonate_grenade" or hackType == "distract" or hackType == "trace" then hackType = nil end
          -- On 2.x most quickhack effects arrive with NO instigator; specific hack effects are
          -- only ever applied to NPCs by V, so accept those too (generic/unknown ones are not).
          if hackType and (isPlayerInstigator or noInstigator) then
            emitPlayerHack(hackType, effId, "status_effect")
          end
        end
      end)
    end)
  end)

  -- Hook the quickhack wheel: exact hack V uploads (title + action record ID)
  local function onQuickhackApplied(self)
      pcall(function()
        local data = nil
        pcall(function() data = self.selectedData end)
        if not data then pcall(function() data = self.m_selectedData end) end
        if not data then return end
        local parts = {}
        pcall(function()
          local t = data.title
          if t and t ~= "" then
            table.insert(parts, tostring(t))
            local okL, loc = pcall(function() return Game.GetLocalizedText(t) end)
            if okL and loc and loc ~= "" then table.insert(parts, loc) end
          end
        end)
        pcall(function()
          local rec = data.action:GetObjectActionRecord()
          table.insert(parts, TDBID.ToStringDEBUG(rec:GetID()))
        end)
        local desc = table.concat(parts, " ")
        local hackType = classifyHack(desc) or "generic"
        emitPlayerHack(hackType, desc, "quickhack_wheel")
      end)
  end
  for _, fnName in ipairs({ "ApplyQuickHack", "ApplyQuickhack" }) do
    pcall(function() ObserveBefore("QuickhacksListGameController", fnName, onQuickhackApplied) end)
  end

  -- Initial Match Entrance
  sendEvent({
    event = "match_started"
  })
end)

registerForEvent("onUpdate", function(delta)
  -- Process Capri Companion Voice/Chat Commands
  pcall(function()
    checkCommands(delta)
  end)
  pcall(function()
    tickCacheSave(delta)
  end)
  pcall(function()
    checkPendingSynaptic(os.clock())
  end)
  -- Generic quickhack line only if no specific hack was identified within 1.5s
  if pendingHackAt and os.clock() - pendingHackAt > 6.0 then
    pcall(function() emitPlayerHack("generic", "ExecuteQuickHack", "input") end)
  end

  pollTimer = pollTimer + delta
  if pollTimer < 0.35 then return end
  local dt = pollTimer
  pollTimer = 0.0

  local player = Game.GetPlayer()
  if not player then
    gameplayTime = 0.0
    return
  end
  gameplayTime = gameplayTime + dt

  -- Combat State Tracking
  pcall(function()
    local inCombat = player:IsInCombat()
    if inCombat ~= lastCombatState then
      lastCombatState = inCombat
      if inCombat then
        print("[CapriCompanion] Combat started!")
        sendEvent({ event = "combat_started" })
      else
        print("[CapriCompanion] Combat ended.")
        sendEvent({ event = "combat_ended" })
      end
    end
  end)

  -- Health & Low Health Tracking (< 25% HP)
  pcall(function()
    local statPools = Game.GetStatPoolsSystem()
    if statPools then
      local currentHp = statPools:GetStatPoolValue(player:GetEntityID(), gamedataStatPoolType.Health, false)
      -- Grace period after loading: HP reads 0 while the save streams in
      if gameplayTime < 15.0 or lastHealthPercent == nil then
        lastHealthPercent = currentHp
        return
      end
      if currentHp <= 0 and lastHealthPercent > 0 then
        local now = os.clock()
        if now - lastDeathTime > 10.0 then
          lastDeathTime = now
          print("[CapriCompanion] Player health depleted!")
          sendEvent({ event = "player_died", killer = "hostile" })
        end
      elseif currentHp <= 25 and lastHealthPercent > 25 then
        print("[CapriCompanion] Low health warning: " .. tostring(math.floor(currentHp)) .. "%")
        sendEvent({ event = "low_health", healthPercent = math.floor(currentHp) })
      end
      lastHealthPercent = currentHp
    end
  end)

  -- Wanted Level (NCPD Stars in Cyberpunk 2.0+)
  pcall(function()
    local ps = Game.GetScriptableSystemsContainer():Get("PreventionSystem")
    if ps and ps.GetHeatStage then
      local heat = ps:GetHeatStage()
      local stars = 0
      if heat == EPreventionHeatStage.Heat_1 then stars = 1
      elseif heat == EPreventionHeatStage.Heat_2 then stars = 2
      elseif heat == EPreventionHeatStage.Heat_3 then stars = 3
      elseif heat == EPreventionHeatStage.Heat_4 then stars = 4
      elseif heat == EPreventionHeatStage.Heat_5 then stars = 5
      end

      if stars > lastWantedStars and stars > 0 then
        print("[CapriCompanion] Wanted level increased: " .. tostring(stars) .. " stars")
        sendEvent({ event = "wanted_level", wantedStars = stars })
      end
      lastWantedStars = stars
    end
  end)

  -- Cyberware Active Status Checks (Sandevistan, Overclock, Berserk)
  pcall(function()
    local ses = Game.GetStatusEffectSystem()
    if ses and player then
      local pId = player:GetEntityID()
      local applied = ses:GetAppliedEffects(pId)
      if applied then
        local now = os.clock()
        for _, eff in ipairs(applied) do
          local rId = eff:GetID()
          local effStr = tostring(rId or "")
          pcall(function()
            if TDBID and TDBID.ToStringDEBUG then
              effStr = effStr .. " " .. TDBID.ToStringDEBUG(rId)
            end
          end)

          if isCyberwareBookkeeping(effStr) then
            -- Still recharging: nothing was activated
          elseif effStr:find("Sandevistan") or effStr:find("TimeDilation") then
            if now - lastCyberwareTime > 6.0 then
              lastCyberwareTime = now
              print("[CapriCompanion] Active Sandevistan in StatusEffectSystem: " .. effStr)
              sendEvent({ event = "sandevistan_activated" })
              break
            end
          elseif effStr:find("Overclock") then
            if now - lastCyberwareTime > 6.0 then
              lastCyberwareTime = now
              print("[CapriCompanion] Active Overclock in StatusEffectSystem: " .. effStr)
              sendEvent({ event = "overclock_activated" })
              break
            end
          elseif effStr:find("Berserk") then
            if now - lastCyberwareTime > 6.0 then
              lastCyberwareTime = now
              print("[CapriCompanion] Active Berserk in StatusEffectSystem: " .. effStr)
              sendEvent({ event = "berserk_activated" })
              break
            end
          end
        end
      end
    end
  end)

  -- Vehicle Velocity, Speed and Crash Detection
  pcall(function()
    local vehicle = Game.GetMountedVehicle(player)
    if vehicle then
      local speedKmh = 0
      local hasVel = false
      pcall(function()
        local vel = vehicle:GetLinearVelocity()
        if vel then
          local mag = math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z)
          speedKmh = math.floor(mag * 3.6)
          hasVel = true
        end
      end)

      if not hasVel then
        local pos = player:GetWorldPosition()
        if lastVehiclePos and dt > 0 then
          local dx = pos.x - lastVehiclePos.x
          local dy = pos.y - lastVehiclePos.y
          local dz = pos.z - lastVehiclePos.z
          local dist = math.sqrt(dx * dx + dy * dy + dz * dz)
          speedKmh = math.floor((dist / dt) * 3.6)
        end
        lastVehiclePos = pos
      end

      local now = os.clock()
      local drop = lastVehicleSpeed - speedKmh

      -- Crash: was moving at >= 30 km/h and drops by >= 20 km/h suddenly or crashes to <= 7 km/h
      if lastVehicleSpeed >= 30 and (drop >= 20 or (lastVehicleSpeed >= 35 and speedKmh <= 7)) and (now - lastCrashTime > 5.0) then
        lastCrashTime = now
        print(string.format("[CapriCompanion] Vehicle crash! Sudden drop from %d km/h to %d km/h", lastVehicleSpeed, speedKmh))
        sendEvent({
          event = "vehicle_crash",
          speed = lastVehicleSpeed
        })
      -- Extreme speed: >= 125 km/h
      elseif speedKmh >= 125 and (now - lastSpeedAlertTime > 15.0) then
        lastSpeedAlertTime = now
        print("[CapriCompanion] Extreme speed driving: " .. tostring(speedKmh) .. " km/h")
        sendEvent({
          event = "extreme_speed",
          speed = speedKmh
        })
      -- High speed: >= 80 km/h
      elseif speedKmh >= 80 and (now - lastSpeedAlertTime > 18.0) then
        lastSpeedAlertTime = now
        print("[CapriCompanion] High speed driving: " .. tostring(speedKmh) .. " km/h")
        sendEvent({
          event = "high_speed_driving",
          speed = speedKmh
        })
      end

      lastVehicleSpeed = speedKmh
    else
      lastVehiclePos = nil
      lastVehicleSpeed = 0
    end
  end)
end)

registerForEvent("onShutdown", function()
  pcall(saveCache)
  sendEvent({
    event = "match_ended"
  })
end)

return Capri
