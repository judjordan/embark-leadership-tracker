(function () {
  "use strict";

  // Fill these in from Supabase Settings -> API. The anon key is safe to
  // ship client-side; access is governed by the RLS policies in the
  // project's SQL, not by keeping this secret.
  var SUPABASE_URL = "https://reoakjuipgdlggxtjtqg.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_rmQtGBLHZq3TGm_wGDxGlg_fwrLjV08";

  var sb = null;
  var configOk = SUPABASE_URL.indexOf("REPLACE_WITH") !== 0 && SUPABASE_ANON_KEY.indexOf("REPLACE_WITH") !== 0;
  if (configOk && window.supabase) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  var TRACKS = ["Ops", "SOPS", "Both"];
  var STAGES = ["Identify", "Investigate", "Integrate", "Install", "Invest"];
  var CATEGORIES = ["Active", "Explore", "Dropped"];
  var CATEGORY_COLOR = { Active: "var(--accent)", Explore: "var(--warn)", Dropped: "var(--off)" };
  var STAGE_COLOR = {
    Identify: "var(--stage-identify)", Investigate: "var(--stage-investigate)",
    Integrate: "var(--stage-integrate)", Install: "var(--stage-install)", Invest: "var(--stage-invest)"
  };
  var EDU_FIELDS = [["sl1", "SL1.0"], ["freedom", "Freedom"], ["theology", "Theology"], ["htgg", "HTGG"]];
  var IDENTITY_KEY = "elt_identity_v1";

  var SPIRITUAL_LEVELS = [
    { level: "L1", name: "Not Interested", body:
      "<p>The not interested person is someone who either has no real knowledge of and belief in Jesus or was once connected to church and, for whatever reason, has since walked away (de-churched). They are not currently seeking Jesus or looking to approach faith. This person is most likely to show up on Christmas or Easter, most often dragged by a family member. In short, they have no real spiritual interest.</p>" },
    { level: "L2", name: "Spiritually Curious / Seeking", body:
      "<p>The seeker is a person who senses that “something” is missing from their life and does not know what it is. Usually a felt need such as loneliness, anxiety, a broken relationship, marriage problems, or any number of other things is the cause of this “missing something” feeling. Although they may not yet be asking about God, they are open to Him, wondering if He might be the answer. Typically, these people are brought into the church by someone who knows them and has what they want. In short, we believe the Holy Spirit is stirring in their souls drawing them to Him.</p>" },
    { level: "L3", name: "Believer", body:
      "<p>A believer is someone who has responded to the movement of the Holy Spirit in their heart and has professed Jesus as Savior. If a level 2 “seeker” senses something is missing from their life and is wondering if it is God, the believer knows it is God and now professes Him to be true. This professed response is a line crossed and only happens from experiencing the Holy Spirit, not simply mentally assenting to it. In the immediate aftermath, new believers are excited, spiritually hungry, and wanting more of Jesus, His way and so much more. These folks now need the basics of faith to put words to what they are experiencing.</p><p>There is one warning for the believer however. If the believer is not fed with the basics of faith, they will quickly stall and fall away never experiencing real joy and life in Jesus.</p>" },
    { level: "L4", name: "Maturing", body:
      "<p>A maturing person is someone whose heart is oriented toward Jesus and is actively pursuing Him. They know the basics of faith, they are hungry for God’s ways, open to being challenged and allowing the Word to change their daily life. They are not just accumulating head knowledge — their thinking, acting and speaking are different and others can see it. They are in community with others, show evidence of a changed life and can mark spiritual growth from year to year. In short, they can be known in 7 ways:</p>" +
      "<ul><li>They initiate — they stop waiting to be fed and seek it on their own, fully engaging feeding themselves.</li>" +
      "<li>They get uncomfortable in the right ways — they experience conviction, have hard conversations, are willing to engage sin and experience struggle.</li>" +
      "<li>They make different decisions concerning money, relationships, and their time.</li>" +
      "<li>They can name what God is doing in them — when asked, they have a specific answer, not just “good” or “fine.”</li>" +
      "<li>They talk differently — God’s activity shows up in their everyday language.</li>" +
      "<li>They start thinking about others — their orientation begins to shift outward and they want others to experience what they experience.</li>" +
      "<li>They can mark spiritual growth and depth from year to year.</li></ul>" +
      "<p>People that are maturing are both group attendees and group leaders.</p>" },
    { level: "L5", name: "Disciple-Maker", body:
      "<p>A disciple-maker is someone who knows how to effectively feed themselves, has habitualized the spiritual disciplines, and is actively helping Level 2s, 3s, and 4s grow deeper. They cannot help but bring others along — for it is not an assignment, it is who they are. They are others-focused by default, feel a sense of responsibility for others’ spiritual growth, and are compelled to do something about it. They often meet with others regularly, either leading a group or doing 1-on-1 discipleship.</p>" }
  ];

  var QUAD_SPIRITUAL_LEVELS = [
    { level: "L2", name: "Seeking", body: "Senses something is missing. Open to God, not yet professing faith." },
    { level: "L3", name: "Believer", body: "Responded to Jesus. Excited and hungry. Needs basics of faith or stalls." },
    { level: "L4", name: "Maturing", body: "Self-feeding, visibly living out faith, initiates for more. Marks growth year over year." },
    { level: "L5", name: "Disciple-maker", body: "Actively grows L2-4s. Others-focused by default." }
  ];
  var QUAD_LEADERSHIP_LEVELS = [
    { level: "1", name: "Follows", body: "Does assigned work reliably. Needs some supervision." },
    { level: "2", name: "Owns a task", body: "On a team, performs their job or task without supervision." },
    { level: "3", name: "Leads a team", body: "Owns outcomes. Recruits for their team. Requires little supervision on running their team." },
    { level: "4", name: "Leads teams", body: "Invites others onto their team, trains and takes ownership of them." },
    { level: "5", name: "Leads leaders", body: "Identifies, develops and leads team leaders. They lead leaders." }
  ];

  var FIVE_IS_INFO = [
    { key: "identify", name: "1 · Identify", objective: "Spot potential leaders and match them to open positions.", body:
      "<p>Search two pools of candidates:</p>" +
      "<ul><li><b>Potential leaders</b> — people who show leadership potential but are still raw; you see more in them than they see in themselves.</li>" +
      "<li><b>Existing leaders</b> — people who arrive with a solid faith life and leadership skills already in place.</li></ul>" +
      "<p>An Embark leader is someone who:</p>" +
      "<ul><li>Has the desire and ability (or potential ability) to lead a ministry area or team</li>" +
      "<li>Will assume and can be trusted with responsibility for that area</li>" +
      "<li>Values both relationships and results</li>" +
      "<li>Is willing to be held accountable for results</li></ul>" +
      "<p>Key characteristics to look for:</p>" +
      "<ul><li><b>Initiative</b> — acts or takes charge before others do</li>" +
      "<li><b>Hungry</b> to grow spiritually and as a leader</li>" +
      "<li><b>Reliable and consistent</b> — demonstrates follow-through</li>" +
      "<li><b>Teachable</b> — receptive to coaching in discipleship, leadership, and ministry</li>" +
      "<li><b>Ownership</b> — has bought into Embark’s culture</li>" +
      "<li><b>Authentic</b> — open and honest about struggles</li>" +
      "<li><b>Relational</b> — friendly, inclusive, gets to know people</li>" +
      "<li><b>Positive attitude</b> — chooses joy</li>" +
      "<li><b>Presence</b> — self-led, secure, carries themselves with authority</li></ul>" },
    { key: "investigate", name: "2 · Investigate", objective: "Assess the candidate’s interest and determine whether to invite them into leadership.", body:
      "<p>Get to know the candidate through conversation and interviews. You are looking for:</p>" +
      "<ul><li>Red, yellow, and green flags regarding culture fit and personal agenda</li>" +
      "<li>Their passions and areas of interest</li>" +
      "<li>Whether they genuinely want to be in leadership</li>" +
      "<li>Relational connection and trust</li></ul>" +
      "<p>Interview questions move from general → narrowing → leadership-focused. If a candidate is interested and you believe they can do it, present open positions and explain the duties, expectations, and the full 5I process. If they are not a fit, point them clearly to their next step.</p>" },
    { key: "integrate", name: "3 · Integrate", objective: "Train the leader for the role.", body:
      "<p>Training is hands-on and structured, tailored to the level of leadership. The core training sequence is:</p>" +
      "<ol><li>I do, you watch</li><li>I do, you help</li><li>You do, I help</li><li>You do, I watch</li><li>You do with another</li></ol>" +
      "<p>Format varies by level: weekly meetings + AARs for Staff; simplified “I do / you do” for Ministry Area leaders; 1-hour meeting for Serve Team leaders; formal sessions with 1-on-1 follow-up for Group Leaders.</p>" },
    { key: "install", name: "4 · Install", objective: "Formally confer authority and full responsibility on the leader.", body:
      "<p>Installation happens publicly — in front of the team, congregation, or relevant group — so others recognize the leader’s authority. It takes place after the leader has already begun working in the role, confirming they can do the job.</p>" +
      "<p>Commissioning order:</p>" +
      "<ol><li>Gather the team, congregation, or relevant group</li>" +
      "<li>Explain what you are doing — you are installing this person as the leader</li>" +
      "<li>Choose and read a Scripture</li>" +
      "<li>Explain their job description and responsibilities to the group</li>" +
      "<li>Have the group lay hands on them</li>" +
      "<li>Pray a short commissioning prayer</li></ol>" },
    { key: "invest", name: "5 · Invest", objective: "Continuously grow, assess, and retain the leader.", body:
      "<p>Hold regular, scheduled check-ins to assess whether the leader remains Faithful, Available, and Teachable (FAT) and to guard against burnout. The leader should talk 70% of the time; you talk 30%. Ask open-ended questions and resist moving to problem-solving too quickly.</p>" +
      "<p>Meeting conversation areas:</p>" +
      "<ul><li><b>Spiritual development</b> — How connected do they feel to God? What is God teaching them? What are they reading?</li>" +
      "<li><b>Performance feedback</b> — What’s going well / not going well? What goals are they working toward? What resources do they need?</li>" +
      "<li><b>Personal check-in</b> — How is family, work outside the church, rest, and enjoyment of their role?</li></ul>" +
      "<p><b>Repeat</b> — once invested in, every leader is invited to do the same with someone else.</p>" }
  ];

  var state = {
    identity: null,
    dbUnavailable: !configOk,
    people: null,
    peopleChannel: null,
    developers: null,
    developersChannel: null,
    view: "developers",
    boardScope: "mine",
    currentPersonId: null,
    currentNotes: null,
    notesChannel: null,
    noteComposerOpen: false,
    suppressDetailRerender: false,
    formError: "",
    peopleLoadTimedOut: false,
    deleteConfirmOpen: false,
    deleteError: "",
    deleteNoteConfirmId: null,
    newDeveloperError: "",
    guideTab: "quad",
    guideOpen: {}
  };

  function isAdmin(name) { return (name || "").trim().toLowerCase() === "jud"; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtDate(d) {
    // Notes carry a plain calendar date (no time). Parse and format it in
    // UTC on both ends so it reads the same regardless of the viewer's
    // timezone, instead of shifting a day depending on local offset.
    try { return new Date(d + "T00:00:00Z").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }); }
    catch (e) { return d; }
  }
  function localDateStr(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function qid(id) { return JSON.stringify(id).replace(/"/g, "&quot;"); }

  // ---------------- row <-> app field mapping ----------------
  function rowToPerson(row) {
    return {
      id: row.id, name: row.name, developer: row.developer, track: row.track,
      stageOps: row.stage_ops, stageSops: row.stage_sops, education: row.education || {},
      category: row.category, developingToward: row.developing_toward || "",
      createdAt: row.created_at, createdBy: row.created_by
    };
  }
  function rowToNote(row) {
    return { id: row.id, author: row.author, date: row.note_date, text: row.body, createdAt: row.created_at };
  }

  // ---------------- identity ----------------
  function loadIdentity() {
    try {
      var raw = localStorage.getItem(IDENTITY_KEY);
      if (raw) state.identity = JSON.parse(raw);
    } catch (e) {}
  }
  function saveIdentity(name) {
    state.identity = { name: name };
    try { localStorage.setItem(IDENTITY_KEY, JSON.stringify(state.identity)); } catch (e) {}
    ensureDeveloper(name);
    state.view = "board";
    state.boardScope = "mine";
    render();
  }
  window.chooseIdentity = function (name) { if (name && name.trim()) saveIdentity(name.trim()); };

  // ---------------- data: people ----------------
  function refetchPeople() {
    if (!sb) return;
    sb.from("people").select("*").order("created_at", { ascending: true }).then(function (res) {
      if (res.error) { state.dbUnavailable = true; render(); return; }
      state.people = res.data.map(rowToPerson);
      state.peopleLoadTimedOut = false;
      if (!(state.suppressDetailRerender && state.view === "detail")) render();
    });
  }

  function subscribePeople() {
    if (!sb || state.peopleChannel) return;
    state.peopleLoadTimedOut = false;
    var timeoutId = setTimeout(function () {
      if (state.people === null) { state.peopleLoadTimedOut = true; render(); }
    }, 8000);
    refetchPeople();
    try {
      state.peopleChannel = sb.channel("people-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "people" }, function () {
          clearTimeout(timeoutId);
          refetchPeople();
        })
        .subscribe();
    } catch (e) {}
    setTimeout(function () { clearTimeout(timeoutId); }, 8100);
  }

  // ---------------- data: developers ----------------
  function refetchDevelopers() {
    if (!sb) return;
    sb.from("developers").select("*").order("created_at", { ascending: true }).then(function (res) {
      if (res.error) return;
      state.developers = res.data;
      render();
    });
  }

  function subscribeDevelopers() {
    if (!sb || state.developersChannel) return;
    refetchDevelopers();
    try {
      state.developersChannel = sb.channel("developers-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "developers" }, refetchDevelopers)
        .subscribe();
    } catch (e) {}
  }

  function ensureDeveloper(name) {
    if (!sb || !name) return;
    var exists = (state.developers || []).some(function (d) { return d.name.trim().toLowerCase() === name.trim().toLowerCase(); });
    if (exists) return;
    sb.from("developers").insert({ name: name.trim() }).then(function () {});
  }

  window.retryLoad = function () {
    state.people = null;
    state.peopleLoadTimedOut = false;
    state.dbUnavailable = !configOk;
    render();
    if (!state.peopleChannel) subscribePeople(); else refetchPeople();
    if (!state.developersChannel) subscribeDevelopers(); else refetchDevelopers();
  };

  function subscribeNotes(personId) {
    if (state.notesChannel) { sb.removeChannel(state.notesChannel); state.notesChannel = null; }
    state.currentNotes = null;
    if (!sb) return;
    function refetchNotes() {
      sb.from("notes").select("*").eq("person_id", personId).order("created_at", { ascending: true }).then(function (res) {
        if (res.error) return;
        state.currentNotes = res.data.map(rowToNote);
        if (!state.noteComposerOpen && !state.suppressDetailRerender) render();
      });
    }
    refetchNotes();
    state.notesChannel = sb.channel("notes-changes-" + personId)
      .on("postgres_changes", { event: "*", schema: "public", table: "notes", filter: "person_id=eq." + personId }, refetchNotes)
      .subscribe();
  }

  function visiblePeople() {
    var list = state.people || [];
    if (state.boardScope === "all") return list;
    if (!state.identity) return [];
    if (isAdmin(state.identity.name)) return list;
    return list.filter(function (p) { return (p.developer || "").trim().toLowerCase() === state.identity.name.trim().toLowerCase(); });
  }

  function findPerson(id) { return (state.people || []).find(function (p) { return p.id === id; }); }
  function patchLocalPerson(id, patch) {
    if (!state.people) return;
    var idx = state.people.findIndex(function (p) { return p.id === id; });
    if (idx > -1) state.people[idx] = Object.assign({}, state.people[idx], patch);
  }

  // ---------------- navigation ----------------
  window.goBoard = function () {
    state.view = "board";
    state.currentPersonId = null;
    state.noteComposerOpen = false;
    if (state.notesChannel) { sb.removeChannel(state.notesChannel); state.notesChannel = null; }
    render();
  };
  window.openBoard = function () {
    state.boardScope = "all";
    window.goBoard();
  };
  window.openPerson = function (id) {
    state.view = "detail";
    state.currentPersonId = id;
    state.noteComposerOpen = false;
    state.deleteConfirmOpen = false;
    state.deleteError = "";
    state.deleteNoteConfirmId = null;
    render();
    subscribeNotes(id);
  };
  window.openAddForm = function () {
    state.view = "add";
    state.formError = "";
    render();
  };
  window.openGuide = function () {
    state.view = "guide";
    render();
  };
  window.openDevelopers = function () {
    state.view = "developers";
    state.newDeveloperError = "";
    render();
  };
  window.setGuideTab = function (tab) {
    state.guideTab = tab;
    render();
  };
  window.toggleGuideItem = function (key) {
    state.guideOpen[key] = !state.guideOpen[key];
    render();
  };

  window.addDeveloper = function () {
    var el = document.getElementById("new-dev-name");
    var name = el ? el.value.trim() : "";
    if (!name) return;
    ensureDeveloper(name);
    if (el) el.value = "";
  };
  window.removeDeveloper = function (id, name) {
    if (isAdmin(name) || !sb) return;
    sb.from("developers").delete().eq("id", id).then(function () {});
  };

  // ---------------- writes ----------------
  function updatePerson(id, patch) {
    patchLocalPerson(id, patch);
    render();
    if (!sb) return;
    var row = {};
    if ("name" in patch) row.name = patch.name;
    if ("developer" in patch) row.developer = patch.developer;
    if ("track" in patch) row.track = patch.track;
    if ("stageOps" in patch) row.stage_ops = patch.stageOps;
    if ("stageSops" in patch) row.stage_sops = patch.stageSops;
    if ("education" in patch) row.education = patch.education;
    if ("category" in patch) row.category = patch.category;
    if ("developingToward" in patch) row.developing_toward = patch.developingToward;
    sb.from("people").update(row).eq("id", id).then(function () {});
  }

  window.onFieldBlur = function (id, field, el) {
    var patch = {}; patch[field] = el.value;
    updatePerson(id, patch);
  };

  window.onTrackChange = function (id, el) {
    var person = findPerson(id);
    if (!person) return;
    var track = el.value;
    var patch = { track: track };
    if ((track === "Ops" || track === "Both") && !person.stageOps) patch.stageOps = "Identify";
    if ((track === "SOPS" || track === "Both") && !person.stageSops) patch.stageSops = "Identify";
    updatePerson(id, patch);
  };

  window.onStageChange = function (id, field, el) {
    var patch = {}; patch[field] = el.value;
    updatePerson(id, patch);
  };

  window.onCategoryChange = function (id, el) { updatePerson(id, { category: el.value }); };

  window.onEduToggle = function (id, key, el) {
    var person = findPerson(id);
    var edu = Object.assign({}, (person && person.education) || {});
    edu[key] = el.checked;
    updatePerson(id, { education: edu });
  };

  window.setTextFocus = function (v) { state.suppressDetailRerender = v; };

  window.toggleNoteComposer = function (open) {
    state.noteComposerOpen = open;
    render();
    if (open) {
      var ta = document.getElementById("note-textarea");
      if (ta) ta.focus();
    }
  };

  window.saveNote = function (personId) {
    var ta = document.getElementById("note-textarea");
    if (!ta || !ta.value.trim() || !sb) return;
    var text = ta.value.trim();
    var author = state.identity ? state.identity.name : "Unknown";
    var now = new Date();
    var noteRow = { person_id: personId, author: author, note_date: localDateStr(now), body: text };
    sb.from("notes").insert(noteRow).select().single().then(function (res) {
      if (!res.error && res.data) {
        if (!state.currentNotes) state.currentNotes = [];
        state.currentNotes = state.currentNotes.concat([rowToNote(res.data)]);
      }
      state.noteComposerOpen = false;
      render();
    });
  };

  window.toggleDeleteConfirm = function (open) {
    state.deleteConfirmOpen = open;
    state.deleteError = "";
    render();
  };

  window.confirmDeletePerson = function (id) {
    if (!sb) return;
    sb.from("people").delete().eq("id", id).then(function (res) {
      if (res.error) {
        state.deleteError = "Couldn't delete. Try again.";
        render();
        return;
      }
      if (state.people) state.people = state.people.filter(function (p) { return p.id !== id; });
      window.goBoard();
    });
  };

  window.toggleDeleteNoteConfirm = function (noteId) {
    state.deleteNoteConfirmId = (state.deleteNoteConfirmId === noteId) ? null : noteId;
    render();
  };

  window.confirmDeleteNote = function (noteId) {
    if (!sb) return;
    sb.from("notes").delete().eq("id", noteId).then(function (res) {
      if (res.error) return;
      if (state.currentNotes) state.currentNotes = state.currentNotes.filter(function (n) { return n.id !== noteId; });
      state.deleteNoteConfirmId = null;
      render();
    });
  };

  window.submitAddForm = function () {
    var name = document.getElementById("f-name").value.trim();
    var developer = document.getElementById("f-developer").value.trim();
    var track = document.getElementById("f-track").value;
    var category = document.getElementById("f-category").value;
    var developingToward = document.getElementById("f-toward").value.trim();

    if (!name || !developer) {
      state.formError = "Name and Developer are required.";
      render();
      return;
    }
    var edu = {};
    EDU_FIELDS.forEach(function (pair) {
      var el = document.getElementById("f-edu-" + pair[0]);
      edu[pair[0]] = !!(el && el.checked);
    });
    var row = {
      name: name, developer: developer, track: track,
      stage_ops: (track === "Ops" || track === "Both") ? "Identify" : null,
      stage_sops: (track === "SOPS" || track === "Both") ? "Identify" : null,
      education: edu, category: category, developing_toward: developingToward,
      created_by: state.identity ? state.identity.name : ""
    };
    if (!sb) { state.formError = "Shared data isn't available right now."; render(); return; }
    sb.from("people").insert(row).select().single().then(function (res) {
      if (res.error || !res.data) {
        state.formError = "Couldn't save. Try again.";
        render();
        return;
      }
      var localDoc = rowToPerson(res.data);
      state.people = (state.people || []).concat([localDoc]);
      ensureDeveloper(developer);
      window.openPerson(localDoc.id);
    });
  };

  // ---------------- render ----------------
  function render() {
    var app = document.getElementById("app");
    var html = renderHeader();
    if (state.dbUnavailable) {
      html += '<div class="banner">Shared data isn’t available right now. Check your connection, or make sure the app’s Supabase keys are configured.</div>';
    }
    if (state.view === "board") html += renderBoard();
    else if (state.view === "detail") html += renderDetail();
    else if (state.view === "add") html += renderAddForm();
    else if (state.view === "guide") html += renderGuide();
    else if (state.view === "developers") html += renderDevelopers();
    app.innerHTML = html;
  }

  function renderHeader() {
    return "" +
      '<header class="topbar"><div class="topbar-row">' +
      '<h1>Embark <span>Leaders</span></h1>' +
      '<div class="identity-chip">' +
      '<button class="nav-btn" onclick="openBoard()"><span aria-hidden="true">📋</span> Board</button>' +
      '<button class="nav-btn" onclick="openGuide()"><span aria-hidden="true">📖</span> Guide</button>' +
      '<button class="nav-btn" onclick="openDevelopers()"><span aria-hidden="true">🧑‍🤝‍🧑</span> Developers</button>' +
      "</div>" +
      "</div></header>";
  }

  function renderBoard() {
    var people = visiblePeople();
    var body;
    if (state.people === null) {
      body = state.peopleLoadTimedOut
        ? '<div class="empty-state"><h2 class="display">Taking a while</h2><p>The roster is taking longer than expected to load. Your connection or the shared data store may be having trouble.</p><button class="btn" onclick="retryLoad()">Try again</button></div>'
        : '<div class="empty-state"><p>Loading roster…</p></div>';
    } else if (people.length === 0) {
      body = '<div class="empty-state"><h2 class="display">No one here yet</h2><p>Add the first person you’re developing to get started.</p><button class="btn" onclick="openAddForm()">+ Add person</button></div>';
    } else {
      body = '<div class="board-wrap">' + CATEGORIES.map(function (cat) {
        var col = people.filter(function (p) { return p.category === cat; });
        return '<div class="column">' +
          '<div class="column-head"><div class="column-title"><span class="dot" style="background:' + CATEGORY_COLOR[cat] + '"></span>' + cat + '</div><span class="count">' + col.length + "</span></div>" +
          '<div class="cards">' + (col.length ? col.map(renderCard).join("") : '<div class="empty-col">No one in ' + cat + ".</div>") + "</div>" +
          "</div>";
      }).join("") + "</div>";
    }
    return body + '<button class="fab" onclick="openAddForm()" aria-label="Add person">+</button>';
  }

  function renderCard(p) {
    var showDev = state.boardScope === "all";
    return '<div class="card" onclick="openPerson(' + qid(p.id) + ')">' +
      '<div class="card-name">' + esc(p.name) + "</div>" +
      '<div class="card-meta"><span class="pill">' + esc(p.track || "") + "</span></div>" +
      (showDev ? '<div class="card-dev">' + esc(p.developer || "") + "</div>" : "") +
      "</div>";
  }

  function stageSelect(p, field, label) {
    var val = p[field] || "Identify";
    return '<div class="field-row"><div class="field-label">' + label + " (Identify/Investigate/Integrate/Install/Invest)</div>" +
      '<div class="field-control chip-select-wrap"><span class="dot" style="background:' + STAGE_COLOR[val] + '"></span>' +
      '<select class="chip-select" onchange="onStageChange(' + qid(p.id) + "," + qid(field) + ',this)">' +
      STAGES.map(function (s) { return '<option value="' + s + '"' + (s === val ? " selected" : "") + ">" + s + "</option>"; }).join("") +
      "</select></div></div>";
  }

  function renderDetail() {
    var p = findPerson(state.currentPersonId);
    if (!p) {
      return '<div class="detail"><div class="back-row"><button class="back-btn" onclick="goBoard()">← Board</button></div><div class="empty-state"><p>This person isn’t available.</p></div></div>';
    }
    var edu = p.education || {};
    var idJs = qid(p.id);

    var html = '<div class="detail">';
    html += '<div class="back-row"><button class="back-btn" onclick="goBoard()">← Board</button></div>';

    html += '<div class="detail-head">';
    html += '<div class="field-name"><input type="text" value="' + esc(p.name) + '" onfocus="setTextFocus(true)" onblur="setTextFocus(false);onFieldBlur(' + idJs + ",'name',this)\"></div>";
    html += '<div class="dev-row">Developer: <input type="text" value="' + esc(p.developer) + '" onfocus="setTextFocus(true)" onblur="setTextFocus(false);onFieldBlur(' + idJs + ",'developer',this)\"></div>";
    html += "</div>";

    html += '<div class="section"><div class="section-label">Track &amp; stage</div>';
    html += '<div class="field-row"><div class="field-label">Track (OPS/SOPS/Both)</div><div class="field-control chip-select-wrap"><select class="chip-select" onchange="onTrackChange(' + idJs + ',this)">' +
      TRACKS.map(function (t) { return '<option value="' + t + '"' + (t === p.track ? " selected" : "") + ">" + t + "</option>"; }).join("") +
      "</select></div></div>";
    if (p.track === "Both") {
      html += stageSelect(p, "stageOps", "Ops 5I Stage");
      html += stageSelect(p, "stageSops", "SOPS 5I Stage");
    } else if (p.track === "SOPS") {
      html += stageSelect(p, "stageSops", "5I Stage");
    } else {
      html += stageSelect(p, "stageOps", "5I Stage");
    }
    html += "</div>";

    html += '<div class="section"><div class="section-label">Education</div><div class="edu-grid">';
    html += EDU_FIELDS.map(function (pair) {
      var key = pair[0], label = pair[1];
      return '<div class="edu-row"><label>' + label + '<input class="check" type="checkbox" ' + (edu[key] ? "checked" : "") + ' onchange="onEduToggle(' + idJs + "," + qid(key) + ',this)"></label></div>';
    }).join("");
    html += "</div></div>";

    html += '<div class="section"><div class="section-label">Category &amp; goal</div>';
    html += '<div class="field-row"><div class="field-label">Category (Active/Explore/Dropped)</div><div class="field-control chip-select-wrap"><span class="dot" style="background:' + CATEGORY_COLOR[p.category] + '"></span><select class="chip-select" onchange="onCategoryChange(' + idJs + ',this)">' +
      CATEGORIES.map(function (c) { return '<option value="' + c + '"' + (c === p.category ? " selected" : "") + ">" + c + "</option>"; }).join("") +
      "</select></div></div>";
    html += '<div class="field-block"><div class="field-label">Developing toward</div><textarea class="free-textarea" rows="2" placeholder="e.g. SERVE Team Director" onfocus="setTextFocus(true)" onblur="setTextFocus(false);onFieldBlur(' + idJs + ",'developingToward',this)\">" + esc(p.developingToward || "") + "</textarea></div>";
    html += "</div>";

    html += '<div class="section"><div class="section-label">Notes</div>';
    if (state.currentNotes === null) {
      html += '<div class="notes-empty">Loading notes…</div>';
    } else if (state.currentNotes.length === 0) {
      html += '<div class="notes-empty">No notes yet.</div>';
    } else {
      html += '<div class="notes-list">' + state.currentNotes.map(function (n) {
        var noteIdJs = qid(n.id);
        var confirming = state.deleteNoteConfirmId === n.id;
        return '<div class="note"><div class="note-meta"><span>' + esc(n.author) + ' &middot; <span class="mono">' + fmtDate(n.date) + "</span></span>" +
          '<button class="note-delete" onclick="toggleDeleteNoteConfirm(' + noteIdJs + ')" aria-label="Delete note">✕</button></div>' +
          '<div class="note-text">' + esc(n.text) + "</div>" +
          (confirming ? '<div class="note-delete-confirm">Delete this note? <button class="btn ghost" onclick="toggleDeleteNoteConfirm(null)">Cancel</button><button class="btn danger" onclick="confirmDeleteNote(' + noteIdJs + ')">Delete</button></div>' : "") +
          "</div>";
      }).join("") + "</div>";
    }
    if (state.noteComposerOpen) {
      html += '<div class="note-composer"><textarea id="note-textarea" placeholder="What happened? What’s next?" onfocus="setTextFocus(true)" onblur="setTextFocus(false)"></textarea>' +
        '<div class="composer-actions"><button class="btn ghost" onclick="toggleNoteComposer(false)">Cancel</button><button class="btn" onclick="saveNote(' + idJs + ')">Save note</button></div></div>';
    } else {
      html += '<button class="add-note-btn" onclick="toggleNoteComposer(true)">+ Add note</button>';
    }
    html += "</div>";

    html += '<div class="section danger-section">';
    if (state.deleteConfirmOpen) {
      html += '<div class="danger-confirm"><p>Delete ' + esc(p.name) + '? This removes their record and all notes — it can’t be undone.</p>' +
        '<div class="composer-actions"><button class="btn ghost" onclick="toggleDeleteConfirm(false)">Cancel</button><button class="btn danger" onclick="confirmDeletePerson(' + idJs + ')">Delete person</button></div></div>';
    } else {
      html += '<button class="delete-btn" onclick="toggleDeleteConfirm(true)">Delete person</button>';
    }
    if (state.deleteError) html += '<div class="error-text">' + esc(state.deleteError) + "</div>";
    html += "</div>";

    html += "</div>";
    return html;
  }

  function renderAddForm() {
    var defaultDeveloper = state.identity ? state.identity.name : "";
    var html = '<div class="form-wrap">';
    html += '<div class="back-row"><button class="back-btn" onclick="goBoard()">← Board</button></div>';
    html += '<h2 class="display" style="margin:6px 0 2px;">Add person</h2>';

    html += '<div class="form-field"><label>Name</label><input id="f-name" type="text" placeholder="Full name"></div>';
    html += '<div class="form-field"><label>Developer</label><input id="f-developer" type="text" value="' + esc(defaultDeveloper) + '"><div class="hint">Who’s leading this person’s development.</div></div>';

    html += '<div class="form-field"><label>Track (OPS/SOPS/Both)</label><div class="select-wrap"><select id="f-track">' +
      TRACKS.map(function (t) { return '<option value="' + t + '">' + t + "</option>"; }).join("") + "</select></div></div>";

    html += '<div class="form-field"><label>Category (Active/Explore/Dropped)</label><div class="select-wrap"><select id="f-category">' +
      CATEGORIES.map(function (c) { return '<option value="' + c + '"' + (c === "Active" ? " selected" : "") + ">" + c + "</option>"; }).join("") + "</select></div></div>";

    html += '<div class="form-field"><label>Education completed</label><div class="checkbox-grid">' +
      EDU_FIELDS.map(function (pair) { return '<label class="check-pill"><input type="checkbox" id="f-edu-' + pair[0] + '"> ' + pair[1] + "</label>"; }).join("") + "</div></div>";

    html += '<div class="form-field"><label>Developing toward</label><textarea id="f-toward" rows="2" placeholder="e.g. SERVE Team Director, alternate preaching"></textarea></div>';

    if (state.formError) html += '<div class="error-text">' + esc(state.formError) + "</div>";
    html += '<div class="form-actions"><button class="btn secondary block" onclick="goBoard()">Cancel</button><button class="btn block" onclick="submitAddForm()">Add person</button></div>';
    html += "</div>";
    return html;
  }

  function accordion(items, openMap, keyField, nameField, extraLabelHtml) {
    return '<div class="accordion">' + items.map(function (item) {
      var key = item[keyField];
      var open = !!openMap[key];
      return '<div class="accordion-item">' +
        '<button class="accordion-head" onclick="toggleGuideItem(' + qid(key) + ')">' +
        '<span>' + esc(item[nameField]) + "</span>" +
        (extraLabelHtml ? extraLabelHtml(item) : "") +
        '<span class="accordion-chevron">' + (open ? "▾" : "▸") + "</span>" +
        "</button>" +
        (open ? '<div class="accordion-body">' + (item.objective ? "<p class=\"objective\"><b>Objective:</b> " + esc(item.objective) + "</p>" : "") + item.body + "</div>" : "") +
        "</div>";
    }).join("") + "</div>";
  }

  function renderGuide() {
    var html = '<div class="detail info-page">';
    html += '<div class="back-row"><button class="back-btn" onclick="goBoard()">← Board</button></div>';
    html += '<h2 class="display" style="margin:6px 0 14px;">Leadership Development Guide</h2>';

    html += '<div class="info-tabs">' +
      ["quad", "levels", "fivei"].map(function (t) {
        var labels = { quad: "OPS / SOPS Quad", levels: "Spiritual Levels", fivei: "The 5Is" };
        return '<button class="info-tab' + (state.guideTab === t ? " active" : "") + '" onclick="setGuideTab(' + qid(t) + ')">' + labels[t] + "</button>";
      }).join("") + "</div>";

    if (state.guideTab === "quad") {
      html += '<div class="info-section">' +
        "<p>Spiritual Operations develops <b>developers</b> who grow people spiritually. Operations develops <b>leaders</b> who run the work. At level 4 or above on either axis, the person is reproducing another leader or developer.</p>" +
        '<div class="quad-diagram">' +
        '<div class="quad-main">' +
        '<div class="quad-y-ticks"><span>L5</span><span>L4</span><span>L3</span><span>L2</span></div>' +
        '<div class="quad-grid">' +
        '<div class="quad-cell quad-developing">Developing</div>' +
        '<div class="quad-cell quad-both">Both Developing<br>and Leading</div>' +
        '<div class="quad-cell quad-growing">Growing</div>' +
        '<div class="quad-cell quad-leading">Leading</div>' +
        "</div>" +
        "</div>" +
        '<div class="quad-x-ticks-row"><div class="quad-y-ticks-spacer"></div><div class="quad-x-ticks"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div></div>' +
        '<div class="quad-axis-caption quad-axis-caption-y">Spiritual Depth <span>(Spiritual Operations — Developer)</span></div>' +
        '<div class="quad-axis-caption quad-axis-caption-x">Leadership Ability <span>(Operations — Leader)</span></div>' +
        "</div>" +
        '<div class="quad-legends">' +
        '<div class="quad-legend"><div class="section-label">Spiritual levels</div>' +
        QUAD_SPIRITUAL_LEVELS.map(function (l) { return '<div class="quad-legend-item"><b>' + l.level + " · " + esc(l.name) + "</b><span>" + esc(l.body) + "</span></div>"; }).join("") +
        "</div>" +
        '<div class="quad-legend"><div class="section-label">Leadership ability</div>' +
        QUAD_LEADERSHIP_LEVELS.map(function (l) { return '<div class="quad-legend-item"><b>' + l.level + " · " + esc(l.name) + "</b><span>" + esc(l.body) + "</span></div>"; }).join("") +
        "</div></div>" +
        "</div>";
    } else if (state.guideTab === "levels") {
      html += '<div class="info-section">' + accordion(SPIRITUAL_LEVELS, state.guideOpen, "level", "name", function (item) { return '<span class="accordion-badge">' + item.level + "</span>"; }) + "</div>";
    } else {
      html += '<div class="info-section">' + accordion(FIVE_IS_INFO, state.guideOpen, "key", "name") + "</div>";
    }

    html += "</div>";
    return html;
  }

  function renderDevelopers() {
    var list = state.developers || [];
    var currentName = state.identity ? state.identity.name.trim().toLowerCase() : null;
    var html = '<div class="detail">';
    html += '<div class="back-row"><button class="back-btn" onclick="goBoard()">← Board</button></div>';
    html += '<h2 class="display" style="margin:6px 0 4px;">Developers</h2>';
    html += '<p style="font-size:13px; color:var(--muted); margin:0 0 8px; line-height:1.5;">Tap a name to become them — that sets who your notes are stamped with and which people you can edit. Anyone can add or remove a name.</p>';
    html += '<div class="dev-list">';
    if (list.length === 0) {
      html += '<div class="notes-empty">Loading…</div>';
    } else {
      html += list.map(function (d) {
        var isYou = currentName && d.name.trim().toLowerCase() === currentName;
        return '<div class="devlist-row"><button class="devlist-name-btn" onclick="chooseIdentity(' + qid(d.name) + ')">' + esc(d.name) + (isYou ? ' <span class="devlist-you">(you)</span>' : "") + "</button>" +
          (isAdmin(d.name)
            ? '<span class="devlist-lock">Admin · can’t remove</span>'
            : '<button class="devlist-delete" onclick="removeDeveloper(' + qid(d.id) + "," + qid(d.name) + ')">Remove</button>') +
          "</div>";
      }).join("");
    }
    html += "</div>";
    html += '<div class="devlist-add-row"><input id="new-dev-name" type="text" placeholder="Full name" onkeydown="if(event.key===\'Enter\')addDeveloper()"><button class="btn secondary" onclick="addDeveloper()">Add</button></div>';
    html += "</div>";
    return html;
  }

  // ---------------- boot ----------------
  loadIdentity();
  state.view = state.identity ? "board" : "developers";
  render();
  if (!configOk) { state.dbUnavailable = true; render(); }
  else { subscribePeople(); subscribeDevelopers(); }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function () {});
    });
  }
})();
