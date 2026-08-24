"use strict";

const GAS_URL = "https://script.google.com/macros/s/AKfycbx1zFtMdZzUatZjM7j-iXNTpP0aQJpWjxgTRk1gWQsxUZ0y18KSnh8zKEEdhI_6Q6oi/exec";
const STORAGE_KEY = "gapMoeSurveyV5Progress";

const overallQuestions = [
  {key:"identity",label:"同じキャラクターに見える",low:"まったく同じに見えない",high:"完全に同じに見える",help:"顔・髪・体型・画風などを含めて判断してください。"},
  {key:"change",label:"元の印象から変化している",low:"まったく変化していない",high:"非常に大きく変化した",help:"服装だけでなく、キャラクターから受ける全体印象の変化です。"},
  {key:"gap",label:"全体としてギャップを感じる",low:"まったく感じない",high:"非常に強く感じる",help:"元のキャラクターから予想した印象との差です。"},
  {key:"moe",label:"全体として萌え・魅力を感じる",low:"まったく感じない",high:"非常に強く感じる",help:"ギャップの有無とは分けて回答してください。"},
  {key:"gapMoe",label:"全体としてギャップ萌えを感じる",low:"まったく感じない",high:"非常に強く感じる",help:"意外性が好意的な魅力につながっているかを評価します。"},
  {key:"fitting",label:"この服装はキャラクターに似合っている",low:"まったく似合わない",high:"非常によく似合う",help:"意外であっても似合う場合があります。"},
  {key:"discomfort",label:"不自然さ・違和感を感じる",low:"まったく感じない",high:"非常に強く感じる",help:"画像品質だけでなく、キャラクターとの不一致も含みます。"}
];

const attributes = [
  {key:"colorTone",label:"色・色調",help:"明るさ、彩度、寒色・暖色など"},{key:"genre",label:"服装ジャンル",help:"制服、カジュアル、ストリート、ロリータなど"},{key:"formality",label:"フォーマル度",help:"端正・礼装的か、日常的・ラフか"},{key:"silhouette",label:"シルエット",help:"丈、フィット感、ボリューム、輪郭など"},{key:"decoration",label:"装飾・小物",help:"フリル、リボン、アクセサリー、バッグなど"},{key:"exposure",label:"露出度",help:"肌の見える範囲や身体の強調"},{key:"characterContrast",label:"性格・普段の印象との対比",help:"服そのものより、キャラクターらしさとの意外な関係"}
];

// 各キャラクターは元画像1枚と変更後画像1枚だけを持つ。
const characters = [
  {id:"c01",name:"朝霧 澪",age:"17歳",personality:"落ち着いている・思慮深い・優しい",feature:"穏やか・儚げ・ミステリアス",original:"images/01-asagiri-mio-private.png",changed:"images-gap/01-asagiri-mio-private.png"},
  {id:"c02",name:"月城 凛",age:"18歳",personality:"冷静・完璧主義・責任感が強い",feature:"クール・知的・近寄りがたい",original:"images/02-tsukishiro-rin-private.png",changed:"images-gap/02-tsukishiro-rin-private.png"},
  {id:"c03",name:"黒瀬 結",age:"16歳",personality:"いたずら好き・大胆・人懐っこい",feature:"魅惑的・華やか・小悪魔的",original:"images/03-kurose-yui-private.png",changed:"images-gap/03-kurose-yui-private.png"},
  {id:"c04",name:"春野 星那",age:"17歳",personality:"明るい・社交的・思いやりがある",feature:"親しみやすい・朗らか・元気いっぱい",original:"images/04-haruno-sena-private.png",changed:"images-gap/04-haruno-sena-private.png"},
  {id:"c05",name:"天城 琥珀",age:"18歳",personality:"自信家・行動的・負けず嫌い",feature:"活発・堂々としている・エネルギッシュ",original:"images/05-amagi-kohaku-private.png",changed:"images-gap/05-amagi-kohaku-private.png"},
  {id:"c06",name:"水野 怜",age:"17歳",personality:"物静か・繊細・思いやりがある",feature:"おとなしい・穏やか・落ち着いている",original:"images/06-mizuno-rei-private.png",changed:"images-gap/06-mizuno-rei-private.png"},
  {id:"c07",name:"風早 永遠",age:"16歳",personality:"自由奔放・好奇心旺盛・責任感が強い",feature:"軽やか・掴みどころがない・個性的",original:"images/07-kazehaya-towa-private.png",changed:"images-gap/07-kazehaya-towa-private.png"},
  {id:"c08",name:"篠原 凪",age:"19歳",personality:"面倒見がいい・優しい・献身的",feature:"温かい・包容力がある・頼りになる",original:"images/08-shinohara-nagi-private.png",changed:"images-gap/08-shinohara-nagi-private.png"},
  {id:"c09",name:"森谷 菫",age:"18歳",personality:"好奇心旺盛・マイペース・観察力が高い",feature:"穏やか・のんびり・知的",original:"images/10-moriya-sumire-private.png",changed:"images-gap/10-moriya-sumire-private.png"}
];

const state={participant:{id:"",age:"",gender:"",anime:"",fashion:"",gapFamiliarity:""},characterOrder:[],answers:[],currentCharacterIndex:0,currentOverall:null,currentAttributes:[],currentAttributeScores:{},startedAt:null,completedAt:null};
const el=id=>document.getElementById(id); const pages=[...document.querySelectorAll(".page")];
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function showPage(id){pages.forEach(p=>p.classList.toggle("active",p.id===id));window.scrollTo({top:0,behavior:"smooth"});}
function currentCharacter(){return characters.find(c=>c.id===state.characterOrder[state.currentCharacterIndex]);}
function saveProgress(show=false){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));if(show){const b=el("saveProgressBtn"),old=b.textContent;b.textContent="保存しました";setTimeout(()=>b.textContent=old,1200);}}
function setProgress(){const h=el("headerProgress");if(!state.startedAt||state.completedAt){h.hidden=true;return;}h.hidden=false;el("headerProgressText").textContent=`キャラクター ${state.currentCharacterIndex+1} / ${state.characterOrder.length}`;el("headerProgressBar").style.width=`${Math.max(3,state.currentCharacterIndex/state.characterOrder.length*100)}%`;}
function renderOverall(){el("overallQuestions").innerHTML=overallQuestions.map(q=>`<div class="rating-row"><div><span class="question-title">${q.label}</span><span class="question-help">${q.help}</span></div><div><div class="likert">${[1,2,3,4,5,6,7].map(v=>`<label><input type="radio" name="overall_${q.key}" value="${v}"><span>${v}</span></label>`).join("")}</div><div class="likert-anchors"><span>${q.low}</span><span>${q.high}</span></div></div></div>`).join("");}
function renderAttributes() {
  el("attributeSelector").innerHTML = `
    <label class="attribute-chip">
      <input type="checkbox" value="none" id="noAttribute">
      <span>
        <strong>特になし</strong>
        <small>変化を感じた要素は特にない</small>
      </span>
    </label>

    ${attributes.map(a => `
      <label class="attribute-chip">
        <input type="checkbox" value="${a.key}">
        <span>
          <strong>${a.label}</strong>
          <small>${a.help}</small>
        </span>
      </label>
    `).join("")}
  `;

  el("attributeSelector")
    .querySelectorAll("input")
    .forEach(input => {
      input.onchange = () => {
        const none = el("noAttribute");

        // 「特になし」を選択
        if (input.value === "none" && input.checked) {
          el("attributeSelector")
            .querySelectorAll('input:not(#noAttribute)')
            .forEach(other => {
              other.checked = false;
            });
        }

        // 通常の項目を選択
        if (input.value !== "none" && input.checked) {
          none.checked = false;
        }

        renderAttributeRatings();
      };
    });

  renderAttributeRatings();
}
function renderAttributeRatings() {
  // 現在入力されている寄与度を保存
  const previousScores = {};

  el("attributeRatings")
    .querySelectorAll('input[type="radio"]:checked')
    .forEach(input => {
      const key = input.name.replace("attr_", "");
      previousScores[key] = Number(input.value);
    });

  // 現在選択されている要素
  const selected = [
  ...el("attributeSelector").querySelectorAll("input:checked")
].map(i => i.value);

  state.currentAttributes = selected;

    // 「特になし」の場合
  if (selected.includes("none")) {

    el("attributeRatings").innerHTML = `
      <p class="muted">
        「特になし」が選択されているため、寄与度の評価はありません。
      </p>
    `;

    return;
  }

    // 通常の要素の場合
  el("attributeRatings").innerHTML = selected.length
    ? selected.map(k => {

        const a = attributes.find(x => x.key === k);

        return `
          <div class="attribute-rating-row">

            <div class="attribute-rating-header">
              <strong>${a.label}</strong>
              <span>この変化がギャップ萌えに関係した程度</span>
            </div>

            <div class="contribution-scale">
              ${[1,2,3,4,5].map(v => `
                <label>
                  <input
                    type="radio"
                    name="attr_${k}"
                    value="${v}"
                    ${previousScores[k] === v ? "checked" : ""}
                  >
                  <span>${v}</span>
                </label>
              `).join("")}
            </div>

            <div class="contribution-anchors">
              <span>ほとんど関係しない</span>
              <span>非常に強く関係した</span>
            </div>

          </div>
        `;

      }).join("")

    : `
      <p class="muted">
        変化を感じた要素を選択してください。
        変化を感じた要素がない場合は「特になし」を選択してください。
      </p>
    `;
}
function loadIntro(){const c=currentCharacter();const preload = new Image();preload.src = c.changed;setProgress();el("characterKicker").textContent=`CHARACTER ${state.currentCharacterIndex+1} / ${state.characterOrder.length}`;el("characterNumber").textContent="元キャラクターの確認";el("originalImage").src=c.original;el("characterName").textContent=c.name;el("characterAge").textContent=c.age;el("characterPersonality").textContent=c.personality;el("characterFeature").textContent=c.feature;el("characterIntro").hidden=false;el("variantEvaluation").hidden=true;el("startCharacterBtn").hidden=true;el("countdownArea").hidden=false;saveProgress();window.scrollTo({top:0,behavior:"smooth"});let count=5;el("countdownNumber").textContent=count;const timer=setInterval(()=>{count--;if(count>0){el("countdownNumber").textContent=count;}else{clearInterval(timer);el("countdownArea").hidden=true;el("startCharacterBtn").hidden=false;}},1000);}
function loadEvaluation(){const c=currentCharacter();el("characterIntro").hidden=true;el("variantEvaluation").hidden=false;el("characterNumber").textContent="変更後画像の評価";el("variantOriginalImage").src=c.original;el("variantImage").src=c.changed;el("variantBadge").textContent="変更後";el("overallPhase").hidden=false;el("attributePhase").hidden=true;el("overallError").textContent="";el("attributeError").textContent="";el("variantReason").value="";state.currentOverall=null;state.currentAttributeScores={};renderOverall();renderAttributes();setProgress();window.scrollTo({top:0,behavior:"smooth"});}
function collectOverall(){const o={};for(const q of overallQuestions){const x=document.querySelector(`input[name="overall_${q.key}"]:checked`);if(!x)return null;o[q.key]=Number(x.value);}return o;}
function showAttributes(){const o=collectOverall();if(!o){el("overallError").textContent="全体評価のすべての項目に回答してください。";return;}state.currentOverall=o;el("overallPhase").hidden=true;el("attributePhase").hidden=false;window.scrollTo({top:0,behavior:"smooth"});}
function saveAnswer() {
  const c = currentCharacter();

  // 実際にチェックされている項目だけ取得
  const selected = [
    ...el("attributeSelector").querySelectorAll("input:checked")
  ].map(i => i.value);

  // 何も選択されていない場合
  if (selected.length === 0) {
    el("attributeError").textContent =
      "変化を感じた要素を1つ以上選択してください。該当する要素がない場合は「特になし」を選択してください。";
    return;
  }

  let scores = {};

  // 「特になし」以外の場合
  if (!selected.includes("none")) {

    // 選択した要素の寄与度がすべて回答されているか確認
    const missing = selected.filter(
      k => !document.querySelector(`input[name="attr_${k}"]:checked`)
    );

    if (missing.length) {
      el("attributeError").textContent =
        "選択したすべての要素について評価してください。";
      return;
    }

    // 寄与度を取得
    scores = Object.fromEntries(
      selected.map(k => [
        k,
        Number(
          document.querySelector(`input[name="attr_${k}"]:checked`).value
        )
      ])
    );
  }

  // エラー表示を消す
  el("attributeError").textContent = "";

  // 同じキャラクターの回答が既にある場合は置き換える
  state.answers = state.answers.filter(
    a => a.characterId !== c.id
  );

  state.answers.push({
    characterId: c.id,
    characterName: c.name,

    originalImage: c.original,
    changedImage: c.changed,

    overall: state.currentOverall,

    perceivedChangedAttributes: selected,

    attributeGapMoeContribution: scores,

    reason: el("variantReason").value.trim(),

    answeredAt: new Date().toISOString()
  });

  saveProgress();

  // 次のキャラクターへ
  if (
    state.currentCharacterIndex <
    state.characterOrder.length - 1
  ) {
    state.currentCharacterIndex++;
    loadIntro();
  } else {
    finishSurvey();
  }
}

let isSubmitting = false;

async function finishSurvey() {

  if (isSubmitting) {
    return;
  }

  isSubmitting = true;

  state.completedAt = new Date().toISOString();

  saveProgress();

  const payload = {
    surveyVersion: "v5",
    schemaVersion: "two-image-v1",
    ...state
  };

  let message = "回答はこの端末に保存されています。";

  if (GAS_URL) {
    try {
      await fetch(GAS_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      message = "回答データを送信しました。";

    } catch (e) {
      console.error("GAS送信エラー:", e);

      message =
        "送信に失敗しました。回答JSONを保存してください。";

      isSubmitting = false;
    }
  }

  el("submitStatus").textContent = message;

  showPage("finish-page");

  setProgress();
}
function downloadJson(){const b=new Blob([JSON.stringify({...state,surveyVersion:"v5",schemaVersion:"two-image-v1"},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`gap-moe-survey-${state.participant.id||"response"}.json`;a.click();URL.revokeObjectURL(a.href);}
function restore(){try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY));if(!s||!s.startedAt||s.completedAt)return false;Object.assign(state,s);return confirm("途中保存された回答があります。続きから再開しますか？");}catch{return false;}}

el("participantForm").addEventListener("submit",e=>{e.preventDefault();const gender=document.querySelector('input[name="gender"]:checked'),values=[el("age").value,gender?.value,el("anime").value,el("fashion").value,el("gapFamiliarity").value];if(values.some(v=>!v)){el("participantError").textContent="必須項目をすべて入力してください。";return;}state.participant={id: `P${Date.now()}`,age: el("age").value,gender: gender.value,anime: el("anime").value,fashion: el("fashion").value,gapFamiliarity: el("gapFamiliarity").value};state.characterOrder=shuffle(characters.map(c=>c.id));state.startedAt=new Date().toISOString();saveProgress();showPage("guide-page");});
el("guideNextBtn").onclick=()=>{showPage("survey-page");loadIntro();};el("startCharacterBtn").onclick=loadEvaluation;el("toAttributeBtn").onclick=showAttributes;el("backToOverallBtn").onclick=()=>{el("attributePhase").hidden=true;el("overallPhase").hidden=false;};el("saveVariantBtn").onclick=saveAnswer;el("saveProgressBtn").onclick=()=>saveProgress(true);el("downloadJsonBtn").onclick=downloadJson;el("clearDataBtn").onclick=()=>{if(confirm("保存データを削除しますか？")){localStorage.removeItem(STORAGE_KEY);location.reload();}};
if(restore()){showPage("survey-page");loadIntro();}
