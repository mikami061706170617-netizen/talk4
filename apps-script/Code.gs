// Talk4 AI relay (Google Apps Script).
// Keeps the Gemini keys private: the app sends its request here, this script adds a key and calls Gemini.
// Setup: Project Settings → Script properties:
//   GEMINI_KEY      = the paid key (plan members, the free trial, the owner)
//   GEMINI_KEY_FREE = the free-tier key (everyone else)
// Deploy → Manage deployments → edit → New version (the address stays the same).
//
// Who gets which AI:
//   plan code (any Talk4 plan code, or the owner's code) → paid key, the stronger models
//   free trial (the app asks for it for the first few minutes) → paid key, limited per day for everyone together
//   everyone else → free key, the fast light models
// The answer carries "t4": "paid" | "trial" | "free" so the app can show the right message.

const DAILY_LIMIT = 3000;        // all AI calls per day (safety)
const TRIAL_DAILY_LIMIT = 400;   // free-trial calls on the paid key per day, for everyone together
const STAFF_DAILY_LIMIT = 800;   // the shop staff code: calls per day for all staff together (if the code leaks, it can't run up the bill)
// Staff codes (shop employees): same strong AI as a plan, with their own daily limit. Change the code = add a new hash, remove the old one.
const STAFF_HASHES = new Set(["8f9ae97eb379a4d2809fcfb4a4010219081844768d25a1a76da0e13c993060a2"]);
const PLAN_HASHES = new Set(["01eb10662c29428f7c00b592ae4cfa3fe08c9946cfb4b80d13a385fed5d16da9", "09b1605c40c5c8d5b008bbff9819eb9ab9f120ecff4e5adefb5da0268851b09a", "0bd65092111e5ad0e6eae83127af9e00eb6cbe6ba1d4d588fd854bc1ca14be79", "0d1cc1670e729f746b9f3d50e15d48b17cba492bd19c0621f6cd2e8612a8e746", "0d34a65e9ff22ed0b73f2d65abd78e393669d6f5246ec806910d433a321705c7", "0d5d4c1bce44fd554712840af0ee3796a7ee216b1e9441f644f61a6d8a708ab9", "0f8346e6960a43359e4b5804f4c1357e8bdb1ed75ebef81eeca18e37c24ae138", "14608363624b7296e1f21c522c14bedde9074922b65ab882bfc6911542440fc3", "15bbe6438bf9d58b849b88dabe7ba9549a809593676c156fbb1ce73f8c93c4b1", "15f85fbf1ccd2146f2b8d9ed8a993e88be6b1c33da03df1a0e9243380b0f5a9d", "1bb96093a969857788af0a630b5fb166d6b3e2bc3ba040358853782f88a1b612", "1c370bbcd7e7eb3c847f3d8cb40b072dbcd9f9c7b7f778d321248ceb419a6643", "2066eb2921ed1d0d1e5c69776feab30ee55d96c13f5bc708079070a2d80bb835", "2447e88b0c18c1f163648aaa672b7cec9e047c3fd14cd76890bf167aab5a1227", "26b1917c96aa67acd674924a3bf54a33636dca4b9ef4bd3aaf1b3f2e1dbf901a", "27a82325b2d581370e286b596fdf31d5cda6dcc41033208f13844388c6db9475", "2815e4e77b7a5373ab23785c8466ae1b70f57502564cc872e5a9cf1921c1ac2d", "309885c5d3e25b0fe082e828f4e0ca7e42b71eac604810e8e3a7873508d3a834", "30bd99a002974ac78185811f4f64f8fd4c64ad625ffc4359c69a744df54b529c", "35080f0b9801cca1c1996f38f1166acdfafdab88031c90443a4f52b9d450fedc", "37603cf9e9707aa1f02dacefc33e08a7da7585fd01e10f8ba3fd3d91e27fe7aa", "3969bbfd7deed58c2bebcb9c825de4cf288b0ec22c5b4d8358b259e9c2a154ff", "3a39416ba1e00ec69b5a764acead8122d20850178224c58ecce517dd5a3d2f38", "3ba29c60a28c242a3e562069443c435d66f2cac0e7d008cae4760f78ee4db1c4", "3f2e6f76b00eab6a44219366c965d88bcc0a09e1c5572afa8059f535ebe0b41c", "42e15c5899a48952ec1b6f9914bf05b8dcdb983b5d0ce7d90092e7b551300d96", "4aca2cfe3a309a40b91d1f92d9ef3e8a25b3560979dae1b3c696b311dc9d465a", "4baa9c82e8c9640262ccbd2821616058a2f064f649a6f2f69627453dfb3f1823", "4d5fe4b8e2ed39d9e8741b3abde09bd3c9980894b585a557445c7094ac99fe2e", "4daadd90d14f4ebff4f36128fe1d476f7b7fbe790401ddb79a8db75c92fff759", "5569cd9ca1b832634a7b103e6651ea316e8d3331708fdba021222fb7fcc12687", "57a2abc43e2187b8f63aa380409887d4bce63fcb14b9441b0150c90bc38b758c", "5afbb450e8fc8c4b96897a1b2d7aa544ba088658796d19bd45b04b4c8482af94", "5ccc011342681b8eec5b57344a066dd2939f53eba1706409e48366c579bc3c64", "5dd8fd12407d0233d57bf19ae0faf2bd4fd6140451687cb43020d59aa7fa65a5", "5ed3544c0d7529285a3ca9866a06922604dc6b89a2aa3d435cef39e98d522bda", "5fa28e1f79f9e500f3d070449020f911b86bc544cd4c4ba8438c7b14422028c5", "600a22f61d02c48b9f084c5f4ae7db5b1b9049abc8c162ad10bb5770185fc485", "640dd2f95a619c1377f33800b4be43c32c354d5834f3fcae513801de5b289c6c", "6adb82cf18933e007ec3d3ae05c51e0cfefbe67ada62e17c4601f6cfe6288db1", "6c052aceb380126b50a3f2add5869bc381d7e0e06b21d2fc3e6930a770d0085d", "6d5821ac15836b2b3e618c28943ce2d1d98884c4142225c857eeef9e829603c5", "6ed60f1d77931e77a5ed5cb39debf37e6fb728c9733fe1fe5eb0813860dfab5e", "6ee2000991cd10479bc5fc5e7e5e73e15610f73b18a48041811aecb3cd51ae04", "70c280639c9ac68e26b5e4e2e62238679c7bc805b4928d857a0ecd43bcefcd53", "72e3f6c233f17c86ef60fb3ad94cbeec576a86128b9ab2050707b7f38c8ff245", "763bb9581a1a516764d9e04ec841ed39ef042ab2d1504f9e71a38ba240516a5b", "775b53495600c61aba9a1ee73525299fdb083dc99d414eac93427c510e3ee77d", "78b884cef9c73a3df3cf64d688a7d5e09c70fbfe238a33d27d2c54d49c12f173", "8616066c77c249e6c8fe67961454c0a6cb1a9373395e86277a6b629516bb145a", "86d2422c99feeca1b74fdc086014e60d0a4cf6392503fe85cfce3df0b8deace3", "8768d744d829c2222bde7d175b9306ad8b72c940dfc71b8e3c7af7ded86c7eac", "897b81459e5d48992fbfa3f75e64ade9d3f46b76c1d66d772badb3a36ca70857", "8b34d61257511e3b80a7f8176ba4bd66986ba79eaf36cdda646155f2b83db6eb", "8b52271a6aa9524c699ffcfc6612e1c82d6b91510bf18eb48fe05c35149abd7a", "8ccdc2ac6b90b735c57e50683216709285cecf1953cd5a8728ee4970f657c3ea", "9225d6e0299e02dbdc1ca9ef47f5eaca35ba22e57c201c7d6c5530306fec6de5", "94eaf754bb6b1548988ab23838a029ee7e71f2ff48c39b9785e3318209bad4d5", "96a1092a92716037dc1e616a281471915c29d19a26969cb411608fb3f4bb2fb9", "96f4935453920da92820269f6fd02265316f9d705e5f929e9e4e5187a5af4798", "9774322f8c2c66eea0db5d947f05f0a7dc5b104cb39c8289bfc6a593bf651ebd", "979e236bc273b94bce4f7c80f54a5f3bb5d1c5ce855652ff54ce8a0bc88ccaf0", "991163a6d619c4d09f6c9382bc272365d42782a66880910714185c1a7861a7e6", "9b1c53c01cad43826db8d7c65096a56f1f0570f06a903e6bc877fb6f44b0a3fd", "9d867de52a6f5d85ca682833509efd650eb20dfc50b257ee7db4c424c0b8ccff", "a86415fe2700465bae3ff4030c9bf3016db4af5695b79ea98053b7546868ce3c", "a9a38710945459876a5ef836e6f264fbfb4252e723d86c3d4d32d6943c02e1e5", "aa65571fe4b7c7e5e7c0aea5a2bf5652d8eee914e97bb0f1938a732d034168cc", "ac7e0e4e3fe52e5306796101f471f521f60dcff2034d5fabc14ab4c815fefaa0", "acffc7ce11a2d1ea2e2fc36d22250228203f134f8bac18721066278c47972262", "ad38c2a293c0f8c282020e42f270aa9696b2f8bc3ebb267dbd399c894fe7c1fa", "af0856094b32c9bb17b567865cbadc30b8fbf0f2b8b875b477b6ab9a31a44268", "b2b5d01c1bc3c34fbbd8b3be471739921cd11b5075b1b67b575a57304c03a4ff", "b71addf7655e7296e2ec1c969f2cb700d3660deebf357b42415e4916fba45a81", "b83d2498504c8859ef0f0c0e69497c8129143268cd4207fbadbff55693f04293", "cb1a7fb9c2bac28f2455427686770d2409b5a80f52c16fc1ae71013c36af7674", "cd6bd572f21d20bfc449f8564d8784afcc44ec7324ca536fd44669aca42f46ac", "d06166733a033223bef8729e53a1dba75ffdfaca889394dead54cf650fa6deb9", "d1d6e9dbccb0ff0e8f6eead791e2f4821cd7394696a0f158bae0f5dcd1dd0c8b", "d699a7ef7b91d66def6725988c036cb1f8ed46f35686864e8eea7e89b52703cf", "db3999547b607f35008338caf5e84348390960353d359c9852c5298e68d4e143", "dc2231dd7850d9573a2bb07c556f7d5d79f63fbb886e0da3b8617300ba39b8c1", "dc27d1d61788491d247190a8ef42e3e175e970777d13421662553f21b34efc55", "e1be1d2eef4700834207ac15eede6c3330396b4aac19a41e610ecf466d6aa881", "e89b45bc0b0faf7d02bbff4ec1ac665d447c059915f67559aad93211ae3f9ee0", "f0782b4db338e273ded014589066f4d15897aa5e13e990e67c1537cb215d384e", "f097f18f44d0b269a60ef1b7409d53384c28e5f7de8070dd1f18bf83b20ed86a", "f1f99b8d46dd68e9ea726aa56d8897b33131f4d0552a5fe7929fbc8592447ac0", "f51eac2cae117d2f0be37b7a5be2a0ec4800a3fc4bf8ffb05a150c4fea6954a8", "f62f037585579665ae69e6d2641e5d6f2485955a30f0b7ca9f6e24d051a8e5d7", "f7db7270517e200262902e62b1073099209f102a62f55919c6d7d0f345e5d23e", "fa13c264f6fd7c929e954aa48ec4aa1f3f6c603420a0e4a8f0d1b84daa502ad6"]);


// ---------- The interpreter's know-how lives here, not in the app ----------
// The app sends only the ingredients (task, words, languages, conversation); the instructions are built here,
// so copying the web page does not copy how Talk4 translates.
const LN = { ja: "Japanese", en: "English", ka: "Georgian", ru: "Russian", ko: "Korean", zh: "Simplified Chinese" };
const JA_HINT = "Japanese often leaves out who and what, and says things indirectly. Translate the MEANING, not the words: fill in the missing subject or object from the conversation, and turn set phrases into what they really mean in context (e.g. 検討します = we will think about it / probably no; 大丈夫です = no thank you, or that's fine; 結構です = no thank you, or that's fine; よろしくお願いします = thank you, I look forward to working with you; お世話になっております = hello, thank you for your help; ちょっと… = that is difficult). Short, clear sentences the listener cannot misunderstand. Japanese questions often have no question mark after voice input and may drop か: if the line asks something (question word, ending like か/の/かな/ですか/ます, or it only makes sense as a question in context), translate it as a clear question ending with \"?\".";
const RULES = "Never add greetings or ideas that were not said. Use the conversation only to understand words like it/that/he; NEVER add any detail (a day, time, place, number, name or reason) that is not in the last line itself. Keep who is who exactly: I/we/us/our = the speaker's side, you = the listener.";
const KA_STYLE = "Write natural, grammatically correct Georgian as a native speaker would say it, with the polite forms used with customers (e.g. რამდენნი ბრძანდებით?). ";
const PLAIN = "Write plain, simple English with no idioms or slang (it will be machine-translated into Georgian, so every word must be literal and clear; e.g. \"How many people?\" not \"How many in your party?\"). ";
const LEARN = "\"names\": every name of a person, company or place in the line ONLY if it is clearly a name (not an ordinary word): [{\"said\":\"as written in the line\",\"en\":\"Latin spelling\",\"ja\":\"Japanese (katakana, or the kanji used)\"}], [] if none";
const s_ = (x, n) => String(x == null ? "" : x).slice(0, n || 2000);
const conv_ = r => (Array.isArray(r) ? r.slice(-6).map(x => s_(x, 400)).join("\n") : "") || "(none)";
function json_req_(parts, temp) { return { contents: [{ parts: parts }], generationConfig: { responseMimeType: "application/json", temperature: temp, thinkingConfig: { thinkingLevel: "low" } } }; }
function buildTask_(b) {
  const from = LN[b.from] ? b.from : "en", to = LN[b.to] ? b.to : "en";
  if (b.task === "translate") {
    const voice = b.voice ? "The last line comes from the phone's voice input and may contain misheard words (a word that sounds similar but makes no sense here). Using the conversation and common sense, work out what the speaker really said, and translate THAT." +
      (Array.isArray(b.voice.alts) && b.voice.alts.length ? " The phone also heard it as: " + b.voice.alts.slice(0, 3).map(a => "\"" + s_(a, 300) + "\"").join(", ") + "." : "") : "";
    const prompt = "You are a professional interpreter in Tbilisi (business meetings, classes, a Japanese restaurant). Translate the last line from " + LN[from] + " to " + LN[to] +
      " so the listener understands exactly what the speaker means, in natural, polite spoken style. Fix obvious speech-recognition mistakes using context. Keep names and numbers exactly. " +
      (b.plain ? PLAIN : "") + (to === "ka" ? KA_STYLE : "") + RULES + (from === "ja" ? "\n" + JA_HINT : "") +
      "\n" + s_(b.names, 3000) + " Shop words (only if said): " + s_(b.shop, 500) + "." +
      "\nConversation so far:\n" + conv_(b.recent) + "\n" + (b.draft ? "Machine draft: " + s_(b.draft) + "\n" : "") + voice +
      "\nLast line: " + s_(b.text) +
      "\nReply ONLY JSON: {\"text\":\"translation\",\"rom\":\"Latin-letter reading of the translation (empty for English)\"," +
      (b.voice ? "\"heard\":\"the last line as the speaker really said it, in " + LN[from] + " (same as given if nothing was misheard)\"," : "") + LEARN + "}";
    return json_req_([{ text: prompt }], 0.2);
  }
  if (b.task === "listen") {
    const prompt = "Write down exactly what is said in this recording. The speaker is speaking " + LN[from] + ". Use " + LN[from] + " script." + (from === "ja" ? " If it is a question, end it with ？." : "") +
      "\n" + s_(b.names, 3000) +
      "\nThen translate it into " + LN[to] + " so the listener understands exactly what the speaker means (natural, polite, spoken; keep names and numbers exactly; a question stays a question). " + (to === "ka" ? KA_STYLE : "") + RULES +
      (from === "ja" ? " Japanese leaves out who and what and speaks indirectly: translate the meaning, not the words." : "") +
      "\nConversation so far:\n" + conv_(b.recent) +
      "\nReply ONLY JSON {\"text\":\"\",\"tr\":\"\"," + LEARN + "}; empty text if there is no speech.";
    return json_req_([{ inline_data: { mime_type: "audio/wav", data: String(b.audio || "") } }, { text: prompt }], 0);
  }
  return null;
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    if (!underLimit_("count_", DAILY_LIMIT)) return json_({ error: { message: "daily limit reached" } });
    const props = PropertiesService.getScriptProperties();
    const paidKey = props.getProperty("GEMINI_KEY"), freeKey = props.getProperty("GEMINI_KEY_FREE") || paidKey;
    if (!paidKey) return json_({ error: { message: "GEMINI_KEY is not set" } });
    let tier = "free";
    const codeHash = body.code ? sha_("talk4-class-v1:" + String(body.code).trim().toUpperCase().replace(/\s+/g, "")) : "";
    if (codeHash && PLAN_HASHES.has(codeHash)) tier = "paid";
    else if (codeHash && STAFF_HASHES.has(codeHash) && underLimit_("staff_", STAFF_DAILY_LIMIT)) tier = "paid";
    // The free trial of the paid AI is only for Talk4's own interpreter tasks: a copied page or a script sending
    // its own raw requests never reaches the paid key without a plan code
    else if (body.trial && body.task && underLimit_("trial_", TRIAL_DAILY_LIMIT)) tier = "trial";
    const key = tier === "free" ? freeKey : paidKey;
    // Reading aloud (used when the phone's own voice stays silent): Google's speech model returns the sound
    if (body.task === "speak") return json_(speak_(body, key, tier));
    const request = body.task ? buildTask_(body) : (body.request || {});
    if (!request) return json_({ error: { message: "unknown task" } });
    // Free: the light models are the only ones fast enough on the free plan; they think "minimal"
    if (tier === "free" && request.generationConfig && request.generationConfig.thinkingConfig) request.generationConfig.thinkingConfig.thinkingLevel = "minimal";
    const list = pickModels_(key), lite = list.filter(m => /lite/.test(m)), full = list.filter(m => !/lite/.test(m));
    // Listening to a recording always uses the full model on the paid key: the light one cuts sentences short and mishears
    const high = body.quality === "high" || body.task === "listen";
    const order = tier !== "free" && high ? full.concat(lite) : lite.concat(full);
    let res = call_(order, request, key);
    // The paid key is out (monthly spending cap reached, or Google is busy): answer with the free key instead of failing
    if (tier !== "free" && freeKey !== paidKey && [429, 403, 500, 503].indexOf(res.getResponseCode()) >= 0) {
      if (request.generationConfig && request.generationConfig.thinkingConfig) request.generationConfig.thinkingConfig.thinkingLevel = "minimal";
      res = call_(lite.concat(full), request, freeKey); tier = "free";
    }
    let out; try { out = JSON.parse(res.getContentText()); } catch (x) { out = { error: { message: "bad reply" } }; }
    out.t4 = tier;
    return json_(out);
  } catch (err) {
    return json_({ error: { message: String(err) } });
  }
}

function speak_(b, key, tier) {
  const cache = CacheService.getScriptCache();
  let models = JSON.parse(cache.get("ttsmodels") || "null");
  if (!models) {
    models = ["gemini-2.5-flash-preview-tts"];
    try {
      const r = UrlFetchApp.fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", { headers: { "x-goog-api-key": key }, muteHttpExceptions: true });
      const names = (JSON.parse(r.getContentText()).models || []).map(m => m.name.replace("models/", "")).filter(n => /flash.*tts|tts.*flash/.test(n));
      if (names.length) models = names.sort((a, c) => c.localeCompare(a)).slice(0, 3);
    } catch (e) {}
    cache.put("ttsmodels", JSON.stringify(models), 21600);
  }
  // only the words themselves: speech models read out any instruction put in front of them
  const rq = { contents: [{ parts: [{ text: s_(b.text, 600) }] }],
    generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: b.g === "m" ? "Charon" : "Kore" } } } } };
  for (const model of models) {
    const res = UrlFetchApp.fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
      method: "post", contentType: "application/json", headers: { "x-goog-api-key": key }, payload: JSON.stringify(rq), muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) continue;
    const part = ((((JSON.parse(res.getContentText()).candidates || [])[0] || {}).content || {}).parts || []).find(p => p.inlineData || p.inline_data);
    if (part) { const d = part.inlineData || part.inline_data; return { audio: d.data, mime: d.mimeType || d.mime_type, t4: tier }; }
  }
  return { error: { message: "no voice" }, t4: tier };
}

function call_(order, request, key) {
    let res = null;
    for (const model of order) {
      const rq = JSON.parse(JSON.stringify(request));
      // the light models accept "minimal" thinking; the full ones need at least "low"
      if (/lite/.test(model) === false && rq.generationConfig && rq.generationConfig.thinkingConfig && rq.generationConfig.thinkingConfig.thinkingLevel === "minimal") rq.generationConfig.thinkingConfig.thinkingLevel = "low";
      res = UrlFetchApp.fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
        method: "post", contentType: "application/json", headers: { "x-goog-api-key": key },
        payload: JSON.stringify(rq), muteHttpExceptions: true,
      });
      const code = res.getResponseCode();
      CacheService.getScriptCache().put("last", model + " " + code, 3600);
      if (code !== 429 && code !== 503 && code !== 500 && code !== 400) break;
    }
    return res;
}

function doGet() {
  const c = CacheService.getScriptCache();
  return json_({ ok: true, service: "talk4-ai", v: 7, models: JSON.parse(c.get("models") || "null"), last: c.get("last") });
}

function sha_(t) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, t, Utilities.Charset.UTF_8)
    .map(b => ((b + 256) % 256).toString(16).padStart(2, "0")).join("");
}

function pickModels_(key) {
  const cache = CacheService.getScriptCache(), hit = cache.get("models3");
  if (hit) return JSON.parse(hit);
  let models = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
  try {
    const r = UrlFetchApp.fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", { headers: { "x-goog-api-key": key }, muteHttpExceptions: true });
    const names = (JSON.parse(r.getContentText()).models || [])
      .filter(m => (m.supportedGenerationMethods || []).indexOf("generateContent") >= 0)
      .map(m => m.name.replace("models/", ""))
      .filter(n => /flash/.test(n) && !/(image|tts|audio|live|thinking|exp|8b|embedding)/.test(n));
    const ver = n => parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) || [0, 0])[1]);
    const sorted = names.sort((a, b) => (/preview/.test(a) - /preview/.test(b)) || ver(b) - ver(a) || a.length - b.length);
    const lite = sorted.filter(n => /lite/.test(n)).slice(0, 3), full = sorted.filter(n => !/lite/.test(n)).slice(0, 3);
    if (lite.length || full.length) models = lite.concat(full);
  } catch (e) {}
  cache.put("models3", JSON.stringify(models), 21600); cache.put("models", JSON.stringify(models), 21600);
  return models;
}

function underLimit_(prefix, limit) {
  const lock = LockService.getScriptLock(); lock.waitLock(5000);
  try {
    const p = PropertiesService.getScriptProperties(), day = Utilities.formatDate(new Date(), "Asia/Tbilisi", "yyyy-MM-dd");
    const k = prefix + day, n = Number(p.getProperty(k) || 0);
    if (n >= limit) return false;
    p.setProperty(k, String(n + 1));
    return true;
  } finally { lock.releaseLock(); }
}

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
