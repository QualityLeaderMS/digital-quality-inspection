const TRADE_DATA = {
  Civil:["RC","RFT","Soil","Formwork","Curing","Waterproofing"],
  Arch:["Block work","Plaster","Paint","Aluminum","Doors","Carpentry","Fences","Tiling","Cladding","Gypsum board","Glazing","Mirrors"],
  Mechanical:["Piping","Fittings","Drain"],
  Electrical:["Wiring","Switches","Panels","Sockets","Data"],
  "Sanitary Ware":["Mixers","Toilet seats","Sink","Bathtub","Shower"],
  Equipment:["AC","Water Heater"],
  Earthwork:["Structural fill","Backfill","General fill","Natural Soil","Excavation","Soil Improvement","Retaining","Keystone"],
  Roads:["Sub-base","Base course","MC","Binder layer","RC","Wearing Layer","Road Marking","Curbstone","Speed hump"],
  Hardscape:["Interlock","Walkways","Fences","Covers","Flooring","Curbstone","Ramps","Stairs","Walls","Cladding","Signage","Lighting","CCTV","Guard house","Gates","Access control","Door","Barrier","Water feature","Pool","Lagoon","Pool deck","Furniture"],
  Landscape:["Planter","Tree","Shrubs","Ground cover","Irrigation","Lighting","Gravel"]
};

const COMMENT_TYPES = ["Defect","Non-Conformance","Observation","Incomplete Work","Material Issue","Workmanship","Safety","Documentation","Other"];
let findings = [];
let logoData = localStorage.getItem("dqi_logo") || "";
let deferredPrompt = null;

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

function today() { return new Date().toISOString().slice(0,10); }

function saveState() {
  const state = {
    companyName:$("companyName").value, projectName:$("projectName").value,
    inspectionDate:$("inspectionDate").value, inspectorName:$("inspectorName").value, findings
  };
  localStorage.setItem("dqi_state", JSON.stringify(state));
  $("saveStatus").innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Saved';
}

function loadState() {
  const raw = localStorage.getItem("dqi_state");
  $("inspectionDate").value = today();
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    $("companyName").value = s.companyName || "";
    $("projectName").value = s.projectName || "";
    $("inspectionDate").value = s.inspectionDate || today();
    $("inspectorName").value = s.inspectorName || "";
    findings = Array.isArray(s.findings) ? s.findings : [];
  } catch {}
}

function addFinding(data={}) {
  findings.push({
    id:crypto.randomUUID ? crypto.randomUUID() : Date.now()+Math.random(),
    trade:data.trade || "Civil", type:data.type || "Defect", description:data.description || "",
    photo:data.photo || "", action:data.action || ""
  });
  render();
  saveState();
}

function removeFinding(id) {
  findings = findings.filter(f=>f.id!==id);
  render(); saveState();
}

function updateFinding(id,key,value) {
  const f=findings.find(x=>x.id===id); if(f) f[key]=value;
  updateDashboard(); saveState();
}

function tradeOptions(selected) {
  return Object.keys(TRADE_DATA).map(t=>`<option ${t===selected?"selected":""}>${esc(t)}</option>`).join("");
}
function typeOptions(selected) {
  return COMMENT_TYPES.map(t=>`<option ${t===selected?"selected":""}>${esc(t)}</option>`).join("");
}

function render() {
  $("emptyState").style.display = findings.length ? "none":"flex";
  $("findings").innerHTML = findings.map((f,i)=>`
    <article class="finding">
      <div class="finding-head">
        <div class="finding-number">Finding #${i+1}</div>
        <div class="finding-actions">
          <button class="icon-btn" title="Delete" onclick="removeFinding('${f.id}')"><i class="fa-regular fa-trash-can"></i></button>
        </div>
      </div>
      <div class="finding-grid">
        <label>Trade
          <select onchange="updateFinding('${f.id}','trade',this.value)">${tradeOptions(f.trade)}</select>
        </label>
        <label>Comment Type
          <select onchange="updateFinding('${f.id}','type',this.value)">${typeOptions(f.type)}</select>
        </label>
        <label class="wide">Observation
          <textarea id="desc-${f.id}" placeholder="Describe the finding clearly...">${esc(f.description)}</textarea>
          <div class="ai-tools">
            <button class="ai-mini" onclick="aiEnhance('${f.id}')"><i class="fa-solid fa-wand-magic-sparkles"></i> Expand Observation</button>
            <button class="ai-mini" onclick="aiAction('${f.id}')"><i class="fa-solid fa-lightbulb"></i> Suggest Action</button>
          </div>
        </label>
        <label class="wide">Corrective Action
          <textarea id="action-${f.id}" placeholder="Required corrective action...">${esc(f.action)}</textarea>
        </label>
        <label class="wide">Photo
          <input type="file" accept="image/*" capture="environment" onchange="photoChange('${f.id}',this.files[0])" />
          <div class="photo-area">
            ${f.photo ? `<img class="photo-preview" src="${f.photo}" alt="Finding photo">` : ""}
            <span style="font-size:10px;color:#64748b">Use camera or choose from gallery.</span>
          </div>
        </label>
      </div>
    </article>`).join("");

  findings.forEach(f=>{
    const d=$("desc-"+f.id), a=$("action-"+f.id);
    if(d) d.addEventListener("input",()=>{ f.description=d.value; saveState(); });
    if(a) a.addEventListener("input",()=>{ f.action=a.value; saveState(); });
  });
  updateDashboard();
}

function photoChange(id,file) {
  if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{ updateFinding(id,"photo",reader.result); render(); };
  reader.readAsDataURL(file);
}

function updateDashboard() {
  $("totalFindings").textContent=findings.length;
  $("tradeCount").textContent=new Set(findings.map(f=>f.trade)).size;
  const trades={}; const types={};
  findings.forEach(f=>{trades[f.trade]=(trades[f.trade]||0)+1; types[f.type]=(types[f.type]||0)+1;});
  const max=Math.max(1,...Object.values(trades));
  $("tradeBreakdown").innerHTML=Object.entries(trades).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`
    <div class="bar-row"><div class="bar-label"><span>${esc(k)}</span><b>${v}</b></div>
    <div class="bar-track"><div class="bar-fill" style="width:${v/max*100}%"></div></div></div>`).join("") || '<span style="font-size:11px;color:#94a3b8">No findings</span>';
  $("typeBreakdown").innerHTML=Object.entries(types).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>`<span class="type-chip">${esc(k)} · ${v}</span>`).join("") || '<span style="font-size:11px;color:#94a3b8">No comment types</span>';
}

function toast(msg) {
  $("toast").textContent=msg; $("toast").classList.add("show");
  setTimeout(()=>$("toast").classList.remove("show"),2200);
}

async function callGemini(prompt) {
  // IMPORTANT: Do not put a production Gemini API key in this PWA.
  // Configure a secure backend endpoint at /api/gemini.
  const res=await fetch("/api/gemini",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({prompt})
  });
  if(!res.ok) throw new Error("AI service unavailable");
  const data=await res.json();
  return data.text || "";
}

async function aiEnhance(id) {
  const f=findings.find(x=>x.id===id); if(!f) return;
  if(!f.description.trim()) return toast("Enter an observation first.");
  try {
    toast("AI is preparing the observation...");
    f.description=await callGemini(`Rewrite this construction QA/QC observation professionally and objectively. Trade: ${f.trade}. Observation: ${f.description}`);
    render(); saveState();
  } catch { toast("AI backend is not connected yet."); }
}

async function aiAction(id) {
  const f=findings.find(x=>x.id===id); if(!f) return;
  if(!f.description.trim()) return toast("Enter an observation first.");
  try {
    toast("AI is suggesting corrective action...");
    f.action=await callGemini(`Suggest a concise, technically appropriate corrective action for this construction QA/QC finding. Trade: ${f.trade}. Finding: ${f.description}`);
    render(); saveState();
  } catch { toast("AI backend is not connected yet."); }
}

async function generateSummary() {
  if(!findings.length) return toast("Add findings first.");
  const local = `Total findings: ${findings.length}\n` + findings.map((f,i)=>`${i+1}. ${f.trade} / ${f.type}: ${f.description}`).join("\n");
  try {
    $("aiSummary").textContent="Generating executive summary...";
    $("aiSummary").textContent=await callGemini(`Prepare an executive QA/QC summary for management. Include overall quality assessment, key risks and recommended actions. Be concise.\n${local}`);
  } catch {
    const counts={}; findings.forEach(f=>counts[f.trade]=(counts[f.trade]||0)+1);
    $("aiSummary").textContent=`${findings.length} finding(s) recorded across ${Object.keys(counts).length} trade(s). Review open observations by priority, ensure corrective actions are assigned, and monitor closure against the project SLA.`;
    toast("AI backend is not connected; local summary shown.");
  }
}

function sampleData() {
  $("companyName").value="MODON";
  $("projectName").value="Sample Residential Development";
  $("inspectionDate").value=today();
  $("inspectorName").value="Quality Inspector";
  findings=[
    {id:"1",trade:"Civil",type:"Workmanship",description:"Localized honeycombing observed at the RC column surface after formwork removal.",action:"Repair affected area using approved repair method and inspect adjacent concrete surfaces.",photo:""},
    {id:"2",trade:"Arch",type:"Defect",description:"Uneven plaster finish identified on the bedroom wall.",action:"Prepare and re-plaster affected area to achieve approved surface tolerance.",photo:""},
    {id:"3",trade:"Electrical",type:"Incomplete Work",description:"Several socket outlets are not yet installed in the living area.",action:"Complete installation, labeling and testing prior to inspection closure.",photo:""},
    {id:"4",trade:"Mechanical",type:"Observation",description:"Drain connection requires verification for proper slope and leakage-free joint.",action:"Verify slope, joint integrity and conduct water test.",photo:""},
    {id:"5",trade:"Landscape",type:"Material Issue",description:"Planting material delivered to site requires verification against approved submittal.",action:"Segregate non-compliant material and verify species, size and condition before installation.",photo:""}
  ];
  render(); saveState(); toast("Sample inspection loaded.");
}

function resetAll() {
  if(!confirm("Reset the current inspection?")) return;
  localStorage.removeItem("dqi_state"); localStorage.removeItem("dqi_logo");
  location.reload();
}

function exportExcel() {
  if(typeof XLSX==="undefined") return toast("Excel library unavailable.");
  const rows=findings.map((f,i)=>({No:i+1,Trade:f.trade,CommentType:f.type,Observation:f.description,CorrectiveAction:f.action}));
  const summary=[{Company:$("companyName").value,Project:$("projectName").value,Date:$("inspectionDate").value,Inspector:$("inspectorName").value,TotalFindings:findings.length}];
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),"Inspection Comments");
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(summary),"Report Summary");
  XLSX.writeFile(wb,`Quality_Inspection_${$("projectName").value||"Report"}.xlsx`);
}

function printReport() { window.print(); }

$("addFindingBtn").onclick=()=>addFinding();
$("sampleBtn").onclick=sampleData;
$("resetBtn").onclick=resetAll;
$("summaryBtn").onclick=generateSummary;
$("excelBtn").onclick=exportExcel;
$("printBtn").onclick=printReport;
["companyName","projectName","inspectionDate","inspectorName"].forEach(id=>$(id).addEventListener("input",saveState));

$("companyLogo").addEventListener("change",e=>{
  const file=e.target.files[0]; if(!file) return;
  const r=new FileReader(); r.onload=()=>{
    logoData=r.result; localStorage.setItem("dqi_logo",logoData);
    $("logoPreview").classList.remove("hidden");
    $("logoPreview").innerHTML=`<img src="${logoData}" alt="Company logo">`;
  }; r.readAsDataURL(file);
});

window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault(); deferredPrompt=e; $("installBtn").hidden=false;
});
$("installBtn").onclick=async()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; $("installBtn").hidden=true;
};

if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(console.error));

loadState();
if(logoData){$("logoPreview").classList.remove("hidden");$("logoPreview").innerHTML=`<img src="${logoData}" alt="Company logo">`;}
render();
