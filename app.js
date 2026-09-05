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
  var KNOWN_PEOPLE = ["Jud", "Crystal Craig", "Jeremy"];
  var IDENTITY_KEY = "elt_identity_v1";

  var state = {
    identity: null,
    dbUnavailable: !configOk,
    people: null,
    peopleChannel: null,
    view: "board",
    currentPersonId: null,
    currentNotes: null,
    notesChannel: null,
    noteComposerOpen: false,
    suppressDetailRerender: false,
    formError: "",
    peopleLoadTimedOut: false
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
    render();
    subscribePeople();
  }
  window.chooseIdentity = function (name) { if (name && name.trim()) saveIdentity(name.trim()); };
  window.chooseIdentityOther = function () {
    var input = document.getElementById("other-name");
    if (input && input.value.trim()) saveIdentity(input.value.trim());
  };
  window.switchIdentity = function () {
    state.identity = null;
    try { localStorage.removeItem(IDENTITY_KEY); } catch (e) {}
    unsubscribeAll();
    state.view = "board";
    render();
  };

  // ---------------- data: people ----------------
  function unsubscribeAll() {
    if (state.peopleChannel) { sb.removeChannel(state.peopleChannel); state.peopleChannel = null; }
    if (state.notesChannel) { sb.removeChannel(state.notesChannel); state.notesChannel = null; }
  }

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

  window.retryLoad = function () {
    state.people = null;
    state.peopleLoadTimedOut = false;
    state.dbUnavailable = !configOk;
    render();
    if (!state.peopleChannel) subscribePeople();
    else refetchPeople();
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
  window.openPerson = function (id) {
    state.view = "detail";
    state.currentPersonId = id;
    state.noteComposerOpen = false;
    render();
    subscribeNotes(id);
  };
  window.openAddForm = function () {
    state.view = "add";
    state.formError = "";
    render();
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
      window.openPerson(localDoc.id);
    });
  };

  // ---------------- render ----------------
  function render() {
    var app = document.getElementById("app");
    if (!state.identity) { app.innerHTML = renderGate(); return; }
    var html = renderHeader();
    if (state.dbUnavailable) {
      html += '<div class="banner">Shared data isn’t available right now. Check your connection, or make sure the app’s Supabase keys are configured.</div>';
    }
    if (state.view === "board") html += renderBoard();
    else if (state.view === "detail") html += renderDetail();
    else if (state.view === "add") html += renderAddForm();
    app.innerHTML = html;
  }

  function renderGate() {
    return "" +
      '<div class="gate"><div class="gate-card">' +
      '<h1 class="display">Embark Leadership<br><span style="color:var(--accent)">Tracker</span></h1>' +
      '<p>Who’s using it right now? This sets who your notes are stamped with and which people you can edit.</p>' +
      '<div class="gate-options">' +
      KNOWN_PEOPLE.map(function (n) {
        return '<button class="gate-btn" onclick="chooseIdentity(' + JSON.stringify(n).replace(/"/g, "&quot;") + ')">' + esc(n) + (isAdmin(n) ? "<small>ADMIN &mdash; sees everyone</small>" : "<small>sees own people</small>") + "</button>";
      }).join("") +
      "</div>" +
      '<div class="gate-other">' +
      '<input id="other-name" type="text" placeholder="Someone else’s name" onkeydown="if(event.key===\'Enter\')chooseIdentityOther()">' +
      '<button class="btn secondary" onclick="chooseIdentityOther()">Go</button>' +
      "</div>" +
      "</div></div>";
  }

  function renderHeader() {
    var isAdm = isAdmin(state.identity.name);
    return "" +
      '<header class="topbar"><div class="topbar-row">' +
      '<h1>Embark <span>Leaders</span></h1>' +
      '<div class="identity-chip"><b>' + esc(state.identity.name) + "</b>" + (isAdm ? " · admin" : "") + '<button class="switch-link" onclick="switchIdentity()">Switch</button></div>' +
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
    var isAdm = isAdmin(state.identity.name);
    return '<div class="card" onclick="openPerson(' + qid(p.id) + ')">' +
      '<div class="card-name">' + esc(p.name) + "</div>" +
      '<div class="card-meta"><span class="pill">' + esc(p.track || "") + "</span></div>" +
      (isAdm ? '<div class="card-dev">' + esc(p.developer || "") + "</div>" : "") +
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
    html += '<div class="field-row"><div class="field-label">Developing toward</div><div class="field-control"><input class="free-input" type="text" value="' + esc(p.developingToward || "") + '" placeholder="e.g. SERVE Team Director" onfocus="setTextFocus(true)" onblur="setTextFocus(false);onFieldBlur(' + idJs + ",'developingToward',this)\"></div></div>";
    html += "</div>";

    html += '<div class="section"><div class="section-label">Notes</div>';
    if (state.currentNotes === null) {
      html += '<div class="notes-empty">Loading notes…</div>';
    } else if (state.currentNotes.length === 0) {
      html += '<div class="notes-empty">No notes yet.</div>';
    } else {
      html += '<div class="notes-list">' + state.currentNotes.map(function (n) {
        return '<div class="note"><div class="note-meta">' + esc(n.author) + ' &middot; <span class="mono">' + fmtDate(n.date) + "</span></div><div class=\"note-text\">" + esc(n.text) + "</div></div>";
      }).join("") + "</div>";
    }
    if (state.noteComposerOpen) {
      html += '<div class="note-composer"><textarea id="note-textarea" placeholder="What happened? What’s next?" onfocus="setTextFocus(true)" onblur="setTextFocus(false)"></textarea>' +
        '<div class="composer-actions"><button class="btn ghost" onclick="toggleNoteComposer(false)">Cancel</button><button class="btn" onclick="saveNote(' + idJs + ')">Save note</button></div></div>';
    } else {
      html += '<button class="add-note-btn" onclick="toggleNoteComposer(true)">+ Add note</button>';
    }
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

  // ---------------- boot ----------------
  loadIdentity();
  render();
  if (!configOk) { state.dbUnavailable = true; render(); }
  else if (state.identity) subscribePeople();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function () {});
    });
  }
})();
