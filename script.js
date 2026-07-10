
// English for Real Australia — Pattern Practice + Quick Add
// Minimal static app with one spaced-repetition system for Patterns and learned Quick Add sentences.

const REVIEW_KEY = 'efra_reviews';
const PLAN_SETTINGS_KEY = 'efra_planSettings';
const PLAN_TASK_KEY = 'efra_planTasks';
const DAILY_INFO_KEY = 'efra_dailyInfo';
const CUSTOM_ITEMS_KEY = 'efra_custom_items';
const QUICKADD_PENDING_KEY = 'efra_quickadd_pending';
const STATS_HISTORY_KEY = 'efra_statsHistory';
const VOICE_KEY = 'efra_voice';
const NOTES_KEY = 'efra_notes';
const PATTERN_PRACTICE_KEY = 'efra_pattern_practice';
const REVIEW_INTERVALS = [1, 3, 7, 14, 30];

let allItems = [];
let itemsMap = {};
let selectedVoiceCode = localStorage.getItem(VOICE_KEY) || 'au';
let selectedVoice = null;

function todayMidnight() { const d = new Date(); d.setHours(0,0,0,0); return d; }
function dateStr(d=todayMidnight()) { return d.toISOString().split('T')[0]; }
function addDays(time, days) { const d = new Date(time); d.setDate(d.getDate()+days); d.setHours(0,0,0,0); return d.getTime(); }
function safeJSON(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch(e){ return fallback; } }
function saveJSON(key, obj){ localStorage.setItem(key, JSON.stringify(obj)); }


function loadNotes(){ return safeJSON(NOTES_KEY, {}); }
function saveNotes(obj){ saveJSON(NOTES_KEY, obj); }
function getNote(id){ return loadNotes()[id] || ''; }
function setNote(id, note){ const notes=loadNotes(); if(note && note.trim()){ notes[id]=note.trim(); } else { delete notes[id]; } saveNotes(notes); }
function loadPatternPractice(){ return safeJSON(PATTERN_PRACTICE_KEY, {}); }
function savePatternPractice(obj){ saveJSON(PATTERN_PRACTICE_KEY, obj); }
function getPractice(id){ return loadPatternPractice()[id] || ''; }
function setPractice(id, text){ const p=loadPatternPractice(); if(text && text.trim()){ p[id]=text.trim(); } else { delete p[id]; } savePatternPractice(p); }

function ensurePatternData(){
  if(!Array.isArray(window.sentencePatterns)){
    window.sentencePatterns = defaultSentencePatterns();
  }
  const existing = new Set(window.sentencePatterns.map(p=>p.id));
  extraSentencePatterns().forEach(p=>{ if(!existing.has(p.id)){ window.sentencePatterns.push(p); existing.add(p.id); } });
  return window.sentencePatterns;
}
function getPatternById(id){ return ensurePatternData().find(p=>p.id===id) || null; }
function inferPatternId(text=''){
  const t = (text || '').toLowerCase().trim();
  if(/^have you been\b/.test(t)) return 'p-have-you-been-ving';
  if(/^have you\b/.test(t)) return 'p-have-you-past';
  if(/^how long/.test(t)) return 'p-how-long';
  if(/^when can i|^when can we|^when can/.test(t)) return 'p-when-can';
  if(/^could you please\b/.test(t)) return 'p-could-you-please';
  if(/^would you mind\b/.test(t)) return 'p-would-you-mind';
  if(/^i'd like\b|^i would like\b/.test(t)) return 'p-id-like-to';
  if(/^i'm looking for\b|^i am looking for\b/.test(t)) return 'p-im-looking-for';
  if(/^i need\b/.test(t)) return 'p-i-need-to';
  if(/^i'm going to\b|^i am going to\b/.test(t)) return 'p-im-going-to';
  if(/^can i\b/.test(t)) return 'p-can-i';
  if(/^do you\b/.test(t)) return 'p-do-you';
  if(/^is there\b/.test(t)) return 'p-is-there';
  if(/^there is\b|^there are\b/.test(t)) return 'p-there-is-are';
  if(/^let me\b/.test(t)) return 'p-let-me';
  if(/^i'm|^i am/.test(t)) return 'p-im-adjective';
  if(/\bis\b|\bare\b/.test(t)) return 'p-be-adjective';
  return 'p-general-statement';
}
function patternForItem(item){
  if(!item) return null;
  return getPatternById(item.patternId || inferPatternId(item.english));
}
function patternsMasteredCount(){
  const reviews=loadReviews();
  return ensurePatternData().filter(p=>{
    const r=reviews['pattern-'+p.id];
    return r && ((r.reviewLevel ?? r.stage ?? 0) >= REVIEW_INTERVALS.length);
  }).length;
}

function loadReviews(){ return safeJSON(REVIEW_KEY, {}); }
function saveReviews(obj){ saveJSON(REVIEW_KEY, obj); }
function getReview(id){ return loadReviews()[id] || null; }
function loadDailyInfo(){ return safeJSON(DAILY_INFO_KEY, {streak:0,lastCompletionDate:null}); }
function saveDailyInfo(info){ saveJSON(DAILY_INFO_KEY, info); }
function loadCustomItems(){ return safeJSON(CUSTOM_ITEMS_KEY, []); }
function saveCustomItems(items){ saveJSON(CUSTOM_ITEMS_KEY, items); }
function loadQuickAddPending(){ return safeJSON(QUICKADD_PENDING_KEY, []); }
function saveQuickAddPending(items){ saveJSON(QUICKADD_PENDING_KEY, items); }

function defaultSettings(){
  return { patterns:5 };
}
function loadPlanSettings(){ return Object.assign(defaultSettings(), safeJSON(PLAN_SETTINGS_KEY, {})); }
function savePlanSettings(settings){ saveJSON(PLAN_SETTINGS_KEY, Object.assign(defaultSettings(), settings)); }
function loadPlanTasks(){ return safeJSON(PLAN_TASK_KEY, {}); }
function savePlanTasks(tasks){ saveJSON(PLAN_TASK_KEY, tasks); }


function defaultSentencePatterns(){
  return [
    {id:'p-have-you-been-ving', pattern:'Have you been + Verb-ing...?', meaning:'Ask about an ongoing recent experience or symptom.', grammar:'Present perfect continuous: have/has + been + verb-ing.', usage:'Very useful for health, childcare and everyday follow-up questions.', examples:['Have you been sleeping well?','Have you been eating normally?','Have you been coughing?','Have you been vomiting?','Have you been exercising?','Have you been feeling dizzy?','Have you been passing urine normally?'], replace:['sleeping','eating normally','coughing','vomiting','feeling dizzy','working late','studying much'], buildPrompt:'Have you been ______ recently?'},
    {id:'p-have-you-past', pattern:'Have you + Past Participle...?', meaning:'Ask whether something has happened before now.', grammar:'Present perfect: have/has + past participle.', usage:'Good for checking experience, completion, symptoms and history.', examples:['Have you taken your medication?','Have you seen a GP?','Have you finished the form?','Have you booked the appointment?','Have you had lunch?'], replace:['taken','seen','finished','booked','had','received','checked'], buildPrompt:'Have you ______ yet?'},
    {id:'p-id-like-to', pattern:"I'd like to + Verb...", meaning:'Politely say what you want to do.', grammar:"I'd like to + base verb.", usage:'Useful in shops, cafes, clinics, childcare and university.', examples:["I'd like to return this item.","I'd like to make an appointment.","I'd like to speak to Mandy's educator.","I'd like to ask about my placement.","I'd like to update my address."], replace:['return this item','make an appointment','speak to someone','ask a question','book a time'], buildPrompt:"I'd like to ______."},
    {id:'p-im-looking-for', pattern:"I'm looking for + Noun...", meaning:'Say what you are trying to find.', grammar:"I'm looking for + noun/noun phrase.", usage:'Very common for shops, hospitals, campus and daily errands.', examples:["I'm looking for the pharmacy.","I'm looking for the supermarket.","I'm looking for my daughter.","I'm looking for room 204.","I'm looking for the student services desk."], replace:['the pharmacy','the toilet','my classroom','the childcare office','the bus stop'], buildPrompt:"I'm looking for ______."},
    {id:'p-could-you-please', pattern:'Could you please + Verb...?', meaning:'Make a polite request.', grammar:'Could you please + base verb.', usage:'Safe and polite in almost every Australian setting.', examples:['Could you please repeat that?','Could you please speak a bit slower?','Could you please help me with this form?','Could you please call me if she gets worse?','Could you please encourage her to drink more water?'], replace:['repeat that','help me','check this','call me','send it again'], buildPrompt:'Could you please ______?'},
    {id:'p-would-you-mind', pattern:'Would you mind + Verb-ing...?', meaning:'Ask someone politely if they are okay with doing something.', grammar:'Would you mind + verb-ing.', usage:'More polite than “Can you”. Good for requests and shared spaces.', examples:['Would you mind closing the door?','Would you mind speaking a little slower?','Would you mind showing me where to sign?','Would you mind checking this for me?'], replace:['closing the door','waiting a moment','checking this','helping me','showing me'], buildPrompt:'Would you mind ______?'},
    {id:'p-can-i', pattern:'Can I + Verb...?', meaning:'Ask for permission or make a simple request.', grammar:'Can I + base verb.', usage:'Useful everywhere: cafe, childcare, university, shops and hospitals.', examples:['Can I pay by card?','Can I ask a quick question?','Can I book an appointment?','Can I speak to the educator?','Can I have a receipt?'], replace:['pay by card','ask a question','book a time','speak to someone','have a receipt'], buildPrompt:'Can I ______?'},
    {id:'p-do-you', pattern:'Do you + Verb...?', meaning:'Ask about habits, services, availability or preferences.', grammar:'Do you + base verb.', usage:'Good for everyday conversations and service situations.', examples:['Do you have any children?','Do you take card?','Do you offer bulk billing?','Do you live nearby?','Do you know where the office is?'], replace:['have','take','offer','live','know','work'], buildPrompt:'Do you ______?'},
    {id:'p-how-long', pattern:'How long will it take...?', meaning:'Ask about expected time.', grammar:'How long will it take + to verb / for noun.', usage:'Very useful for appointments, repairs, applications and waiting.', examples:['How long will it take to process?','How long will it take to get there?','How long will the appointment take?','How long will it take for her to settle?'], replace:['to process','to get there','to finish','for her to settle','for the result to come back'], buildPrompt:'How long will it take ______?'},
    {id:'p-when-can', pattern:'When can I expect + Noun...?', meaning:'Ask when something will happen or arrive.', grammar:'When can I expect + noun/noun phrase.', usage:'Polite and useful for emails, admin and services.', examples:['When can I expect the result?','When can I expect a reply?','When can I expect the card to arrive?','When can I expect the placement details?'], replace:['the result','a reply','the delivery','the update','the placement details'], buildPrompt:'When can I expect ______?'},
    {id:'p-is-there', pattern:'Is there + Noun...?', meaning:'Ask whether something exists or is available.', grammar:'Is there + singular/uncountable noun; Are there + plural noun.', usage:'Useful for finding information and asking about options.', examples:['Is there a toilet nearby?','Is there a fee?','Is there a form I need to fill out?','Is there anything I need to bring?','Are there any discounts?'], replace:['a toilet nearby','a fee','a form','anything I need to bring','any discounts'], buildPrompt:'Is there ______?'},
    {id:'p-there-is-are', pattern:'There is / There are + Noun...', meaning:'Describe what exists or is present.', grammar:'There is + singular; there are + plural.', usage:'Useful for describing situations clearly.', examples:['There is a problem with the app.','There are a few things I need to ask.','There is no parking nearby.','There are many students in the class.'], replace:['a problem','a form','no parking','a few things','many students'], buildPrompt:'There is / There are ______.'},
    {id:'p-im-going-to', pattern:"I'm going to + Verb...", meaning:'Talk about a future plan or intention.', grammar:"I'm going to + base verb.", usage:'Natural way to talk about plans in daily conversation.', examples:["I'm going to pick her up early.","I'm going to book an appointment.","I'm going to study tonight.","I'm going to call the clinic."], replace:['pick her up','book an appointment','study tonight','call the clinic','check the roster'], buildPrompt:"I'm going to ______."},
    {id:'p-i-need-to', pattern:'I need to + Verb...', meaning:'Say what you must do.', grammar:'I need to + base verb.', usage:'Very common and useful in daily life, study and work.', examples:['I need to update my address.','I need to book a GP appointment.','I need to submit this form.','I need to practise my English.'], replace:['update my address','book an appointment','submit this form','ask my teacher','practise speaking'], buildPrompt:'I need to ______.'},
    {id:'p-let-me', pattern:'Let me + Verb...', meaning:'Offer to do something or ask for a moment.', grammar:'Let me + base verb.', usage:'Natural and helpful for conversations and problem solving.', examples:['Let me check.','Let me think about it.','Let me ask my husband.','Let me get back to you.','Let me see what I can do.'], replace:['check','think about it','ask someone','get back to you','see what I can do'], buildPrompt:'Let me ______.'},
    {id:'p-be-adjective', pattern:'Be + Adjective', meaning:'Describe a person, thing or situation.', grammar:'am/is/are/was/were + adjective.', usage:'A foundation pattern for expressing feelings, conditions and descriptions.', examples:['She is tired.','The course is challenging.','The weather is beautiful.','The neighbourhood is quiet.','I am nervous.'], replace:['tired','busy','challenging','beautiful','quiet','nervous'], buildPrompt:'Subject + be + ______.'},
    {id:'p-im-adjective', pattern:"I'm + Adjective / Feeling...", meaning:'Describe your feeling or state.', grammar:"I'm + adjective / I'm feeling + adjective.", usage:'Useful for small talk, healthcare, study and work.', examples:["I'm a bit nervous.","I'm feeling much better.","I'm not sure.","I'm still learning.","I'm happy with that."], replace:['nervous','better','not sure','still learning','happy with that'], buildPrompt:"I'm ______."},
    {id:'p-general-statement', pattern:'Subject + Verb + Object/Complement', meaning:'Make a clear basic statement.', grammar:'Subject + verb + object/complement.', usage:'A basic flexible pattern for simple communication.', examples:['She likes childcare.','I live in Wodonga.','The class starts at nine.','My daughter enjoys playing outside.'], replace:['live in Wodonga','like this course','start at nine','enjoy playing','need help'], buildPrompt:'Subject + verb + ______.'}
  ];
}


function extraSentencePatterns(){
  const rows = [
    ['p-could-i','Could I + Verb...?','Politely ask for permission or help.','Could I + base verb.','Gentle and polite in public services.',['Could I book an appointment?','Could I speak to the nurse?','Could I check the time?','Could I leave a message?','Could I ask one more question?'],['book an appointment','speak to someone','check the time','leave a message','ask a question'],'Could I ______?'],
    ['p-i-was-wondering-if','I was wondering if + Clause...','Politely introduce a request or question.','I was wondering if + normal word order.','Useful in emails, university and polite spoken requests.',['I was wondering if you could help me.','I was wondering if the appointment is still available.','I was wondering if I could change my shift.','I was wondering if there is any update.'],['you could help me','the time is available','I could change my shift','there is any update'],'I was wondering if ______.'],
    ['p-do-you-mind-if','Do you mind if I + Verb...?','Ask if something is okay.','Do you mind if I + base verb.','Useful when sharing spaces or asking permission.',['Do you mind if I sit here?','Do you mind if I ask a question?','Do you mind if I close the window?','Do you mind if I leave early?'],['sit here','ask a question','close the window','leave early'],'Do you mind if I ______?'],
    ['p-i-have-to','I have to + Verb...','Say something is necessary.','I have to + base verb.','Common for daily obligations.',['I have to pick up my daughter.','I have to submit the form.','I have to go to placement tomorrow.','I have to call the clinic.'],['pick up my daughter','submit the form','go to placement','call the clinic'],'I have to ______.'],
    ['p-i-used-to','I used to + Verb...','Talk about a past habit.','Used to + base verb.','Useful for personal stories and background.',['I used to live in China.','I used to work in healthcare.','I used to drive every day.','I used to study at night.'],['live in China','work in healthcare','drive every day','study at night'],'I used to ______.'],
    ['p-im-used-to','I’m used to + Noun / Verb-ing...','Say something feels normal now.','Be used to + noun/verb-ing.','Useful for adapting to Australian life.',['I’m used to the weather now.','I’m used to speaking English every day.','I’m used to driving here.','I’m getting used to the course.'],['the weather','speaking English','driving here','the workload'],'I’m used to ______.'],
    ['p-im-not-used-to','I’m not used to + Noun / Verb-ing...','Say something still feels unfamiliar.','Be not used to + noun/verb-ing.','Useful when explaining difficulty.',['I’m not used to the accent yet.','I’m not used to driving at night.','I’m not used to the workload.','I’m not used to speaking in class.'],['the accent','driving at night','the workload','speaking in class'],'I’m not used to ______ yet.'],
    ['p-it-depends-on','It depends on + Noun...','Say the answer changes based on something.','It depends on + noun phrase.','Natural for decisions and explanations.',['It depends on the weather.','It depends on my timetable.','It depends on the placement location.','It depends on how she feels.'],['the weather','my timetable','the location','how she feels'],'It depends on ______.'],
    ['p-the-thing-is','The thing is, + Clause...','Introduce the real reason or problem.','The thing is, + complete clause.','Common in natural spoken English.',['The thing is, I’m still learning English.','The thing is, I don’t have my licence yet.','The thing is, my daughter is sick.','The thing is, I’m not sure what to do.'],['I’m still learning','I don’t have my licence','my daughter is sick','I’m not sure'],'The thing is, ______.'],
    ['p-that-sounds','That sounds + Adjective...','React naturally to what someone says.','That sounds + adjective.','Useful for small talk and empathy.',['That sounds great.','That sounds difficult.','That sounds really busy.','That sounds like a good idea.'],['great','difficult','busy','like a good idea'],'That sounds ______.'],
    ['p-i-think','I think + Clause...','Give an opinion softly.','I think + complete clause.','Safer than direct statements in conversation.',['I think that’s a good idea.','I think she is settling in.','I think I need more practice.','I think the course is challenging.'],['that’s a good idea','she is settling in','I need more practice','the course is challenging'],'I think ______.'],
    ['p-i-feel-like','I feel like + Verb-ing / Clause...','Express a feeling or preference.','I feel like + verb-ing / I feel like + clause.','Natural in casual conversation.',['I feel like having a coffee.','I feel like staying home today.','I feel like I’m getting better.','I feel like the workload is heavy.'],['having a coffee','staying home','I’m improving','the workload is heavy'],'I feel like ______.'],
    ['p-i-dont-mind','I don’t mind + Noun / Verb-ing...','Say either option is okay.','I don’t mind + noun/verb-ing.','Useful when making plans.',['I don’t mind waiting.','I don’t mind either way.','I don’t mind driving.','I don’t mind meeting earlier.'],['waiting','either way','driving','meeting earlier'],'I don’t mind ______.'],
    ['p-do-you-know-if','Do you know if + Clause...?','Ask for information indirectly.','Do you know if + normal word order.','Very useful and polite.',['Do you know if the clinic is open?','Do you know if there is parking?','Do you know if the class is online?','Do you know if she ate lunch?'],['the clinic is open','there is parking','the class is online','she ate lunch'],'Do you know if ______?'],
    ['p-can-you-let-me-know','Can you let me know + Clause...?','Ask someone to inform you.','Can you let me know + clause.','Useful for childcare, admin and work.',['Can you let me know if she gets upset?','Can you let me know when it’s ready?','Can you let me know if there are any changes?','Can you let me know what I need to bring?'],['if she gets upset','when it’s ready','if anything changes','what to bring'],'Can you let me know ______?'],
    ['p-i-just-wanted-to','I just wanted to + Verb...','Softly introduce your purpose.','I just wanted to + base verb.','Useful for emails and polite conversations.',['I just wanted to check something.','I just wanted to ask about placement.','I just wanted to update my address.','I just wanted to say thank you.'],['check something','ask about placement','update my address','say thank you'],'I just wanted to ______.'],
    ['p-thanks-for','Thanks for + Verb-ing / Noun...','Thank someone naturally.','Thanks for + verb-ing/noun.','Very useful daily.',['Thanks for helping me.','Thanks for letting me know.','Thanks for looking after her.','Thanks for your time.'],['helping me','letting me know','looking after her','your time'],'Thanks for ______.'],
    ['p-sorry-about','Sorry about + Noun / Verb-ing...','Apologise briefly.','Sorry about + noun/verb-ing.','Common in everyday interactions.',['Sorry about the delay.','Sorry about the confusion.','Sorry about being late.','Sorry about the noise.'],['the delay','the confusion','being late','the noise'],'Sorry about ______.'],
    ['p-im-having-trouble','I’m having trouble + Verb-ing...','Explain a difficulty.','I’m having trouble + verb-ing.','Useful for study, tech and daily problems.',['I’m having trouble logging in.','I’m having trouble understanding the accent.','I’m having trouble finding the room.','I’m having trouble filling out the form.'],['logging in','understanding the accent','finding the room','filling out the form'],'I’m having trouble ______.'],
    ['p-it-would-be-helpful','It would be helpful if + Clause...','Politely say what would help.','It would be helpful if + clause.','Useful for requests without sounding demanding.',['It would be helpful if you could write it down.','It would be helpful if I could get more time.','It would be helpful if you could explain it again.'],['you could write it down','I could get more time','you could explain it again'],'It would be helpful if ______.'],
    ['p-im-not-sure-how','I’m not sure how to + Verb...','Say you need help with a process.','I’m not sure how to + base verb.','Useful for learning and admin.',['I’m not sure how to upload the document.','I’m not sure how to book the test.','I’m not sure how to answer this question.'],['upload the document','book the test','answer this question'],'I’m not sure how to ______.'],
    ['p-could-i-get','Could I get + Noun...?','Politely ask for something.','Could I get + noun.','Common in cafes, clinics and offices.',['Could I get a flat white?','Could I get a receipt?','Could I get a copy of the form?','Could I get your name?'],['a flat white','a receipt','a copy','your name'],'Could I get ______?'],
    ['p-i-would-rather','I’d rather + Verb...','State a preference.','Would rather + base verb.','Useful for choices and plans.',['I’d rather stay home.','I’d rather book a morning appointment.','I’d rather pay by card.','I’d rather practise first.'],['stay home','book a morning time','pay by card','practise first'],'I’d rather ______.'],
    ['p-it-looks-like','It looks like + Clause/Noun...','Comment on what seems true.','It looks like + clause/noun.','Useful for observations and small talk.',['It looks like rain later.','It looks like she had a good day.','It looks like the class is full.','It looks like we need to wait.'],['rain later','she had a good day','the class is full','we need to wait'],'It looks like ______.'],
    ['p-im-trying-to','I’m trying to + Verb...','Explain what you are attempting.','I’m trying to + base verb.','Useful when asking for help.',['I’m trying to improve my speaking.','I’m trying to find the classroom.','I’m trying to book an appointment.','I’m trying to understand the instructions.'],['improve my speaking','find the room','book an appointment','understand the instructions'],'I’m trying to ______.']
  ];

  rows.push(
    ['p-can-you-help-me','Can you help me + Verb...?','Ask directly for help with an action.','Can you help me + base verb.','Useful for asking classmates, staff or colleagues for support.',['Can you help me find the room?','Can you help me understand this form?','Can you help me practise this sentence?','Can you help me carry this bag?'],['find the room','understand this form','practise','carry this'],'Can you help me ______?'],
    ['p-i-have-a-question-about','I have a question about + Noun...','Introduce the topic you want to ask about.','I have a question about + noun phrase.','Very useful in university, childcare and services.',['I have a question about my placement.','I have a question about the timetable.','I have a question about the bill.','I have a question about childcare fees.'],['my placement','the timetable','the bill','the fees'],'I have a question about ______.'],
    ['p-im-here-to','I’m here to + Verb...','Explain your purpose when arriving somewhere.','I’m here to + base verb.','Useful at reception, clinics and offices.',['I’m here to see the GP.','I’m here to pick up my daughter.','I’m here to submit my documents.','I’m here to attend orientation.'],['see the GP','pick up my daughter','submit documents','attend orientation'],'I’m here to ______.'],
    ['p-i-need-help-with','I need help with + Noun / Verb-ing...','Say exactly what you need help with.','I need help with + noun/verb-ing.','Useful when stuck or confused.',['I need help with this form.','I need help with my enrolment.','I need help with understanding the task.','I need help with pronunciation.'],['this form','my enrolment','understanding this','pronunciation'],'I need help with ______.'],
    ['p-i-dont-understand','I don’t understand + Noun/Clause...','Say you need clarification.','I don’t understand + noun/clause.','Essential for study and work.',['I don’t understand this question.','I don’t understand what she said.','I don’t understand the instructions.','I don’t understand the accent yet.'],['this question','what she said','the instructions','the accent'],'I don’t understand ______.'],
    ['p-could-you-explain','Could you explain + Noun...?','Ask for an explanation politely.','Could you explain + noun/clause.','Useful with teachers, nurses and admin staff.',['Could you explain this again?','Could you explain the process?','Could you explain what I need to do?','Could you explain the medication chart?'],['this again','the process','what I need to do','the chart'],'Could you explain ______?'],
    ['p-what-does-mean','What does + Noun + mean?','Ask the meaning of a word or instruction.','What does + noun + mean?','Useful for vocabulary growth.',['What does this word mean?','What does bulk billing mean?','What does this abbreviation mean?','What does NDIS mean?'],['this word','bulk billing','this abbreviation','NDIS'],'What does ______ mean?'],
    ['p-what-should-i','What should I + Verb...?','Ask for advice or the next step.','What should I + base verb.','Useful when unsure what action to take.',['What should I do next?','What should I bring?','What should I write here?','What should I say to the teacher?'],['do next','bring','write here','say'],'What should I ______?'],
    ['p-where-can-i','Where can I + Verb...?','Ask where to do something.','Where can I + base verb.','Useful in new places.',['Where can I park?','Where can I find the toilet?','Where can I upload this document?','Where can I buy a SIM card?'],['park','find the toilet','upload this','buy a SIM card'],'Where can I ______?'],
    ['p-who-should-i','Who should I + Verb...?','Ask the right person to contact.','Who should I + base verb.','Useful for university and services.',['Who should I contact?','Who should I speak to?','Who should I ask about placement?','Who should I email?'],['contact','speak to','ask','email'],'Who should I ______?'],
    ['p-i-was-told-to','I was told to + Verb...','Report an instruction you received.','I was told to + base verb.','Useful for explaining admin steps.',['I was told to upload this document.','I was told to contact the placement team.','I was told to wait for an email.','I was told to bring my ID.'],['upload this','contact the team','wait for an email','bring my ID'],'I was told to ______.'],
    ['p-im-supposed-to','I’m supposed to + Verb...','Say what you are expected to do.','I’m supposed to + base verb.','Useful for study, work and appointments.',['I’m supposed to start at eight.','I’m supposed to bring my uniform.','I’m supposed to complete this module.','I’m supposed to call the clinic.'],['start at eight','bring my uniform','complete this','call the clinic'],'I’m supposed to ______.'],
    ['p-are-you-able-to','Are you able to + Verb...?','Ask politely if someone can do something.','Are you able to + base verb.','Polite alternative to “Can you”.',['Are you able to send it again?','Are you able to check this for me?','Are you able to call me back?','Are you able to help me with this?'],['send it again','check this','call me back','help me'],'Are you able to ______?'],
    ['p-would-it-be-possible','Would it be possible to + Verb...?','Very polite way to ask if something can happen.','Would it be possible to + base verb.','Useful for formal requests.',['Would it be possible to change the time?','Would it be possible to get an extension?','Would it be possible to speak to someone?','Would it be possible to book another appointment?'],['change the time','get an extension','speak to someone','book another appointment'],'Would it be possible to ______?'],
    ['p-i-want-to-make-sure','I want to make sure + Clause...','Say you want to confirm something.','I want to make sure + clause.','Useful to avoid misunderstanding.',['I want to make sure I understand correctly.','I want to make sure she has everything.','I want to make sure the form is complete.','I want to make sure I’m in the right place.'],['I understand correctly','she has everything','the form is complete','I’m in the right place'],'I want to make sure ______.'],
    ['p-just-to-confirm','Just to confirm, + Clause...','Politely check information again.','Just to confirm, + clause.','Very common in emails and conversations.',['Just to confirm, the meeting is at ten.','Just to confirm, I need to bring my ID.','Just to confirm, she can be picked up by my friend.','Just to confirm, the class is online.'],['the meeting is at ten','I need to bring ID','she can be picked up','the class is online'],'Just to confirm, ______.'],
    ['p-as-far-as-i-know','As far as I know, + Clause...','Share information carefully.','As far as I know, + clause.','Useful when you are not 100% certain.',['As far as I know, the clinic is open.','As far as I know, the document has been submitted.','As far as I know, she is feeling better.','As far as I know, the class starts next week.'],['the clinic is open','it has been submitted','she is better','class starts next week'],'As far as I know, ______.'],
    ['p-im-afraid','I’m afraid + Clause...','Give bad news politely.','I’m afraid + clause.','Useful for polite refusals or problems.',['I’m afraid I can’t make it today.','I’m afraid I don’t understand.','I’m afraid she is still unwell.','I’m afraid I need to leave early.'],['I can’t make it','I don’t understand','she is unwell','I need to leave early'],'I’m afraid ______.'],
    ['p-if-possible','If possible, I’d like to + Verb...','Make a flexible polite request.','If possible, I’d like to + base verb.','Useful for appointments and preferences.',['If possible, I’d like to book a morning appointment.','If possible, I’d like to speak to her educator.','If possible, I’d like to change my shift.','If possible, I’d like to get more practice.'],['book a morning time','speak to the educator','change my shift','get more practice'],'If possible, I’d like to ______.'],
    ['p-in-case','In case + Clause...','Explain preparation for a possible situation.','In case + clause.','Useful for planning and safety.',['I packed extra clothes in case she gets wet.','Take an umbrella in case it rains.','I wrote it down in case I forget.','Bring your ID in case they ask for it.'],['she gets wet','it rains','I forget','they ask for it'],'In case ______.'],
    ['p-because-of','Because of + Noun...','Give a reason using a noun.','Because of + noun phrase.','Useful for explaining changes.',['She stayed home because of a fever.','I was late because of traffic.','The class was cancelled because of the weather.','I felt tired because of placement.'],['a fever','traffic','the weather','placement'],'Because of ______.'],
    ['p-i-cant-make-it','I can’t make it + Time...','Say you cannot attend.','I can’t make it + time/event.','Useful for appointments and meetings.',['I can’t make it today.','I can’t make it to class tomorrow.','I can’t make it at that time.','I can’t make it to the appointment.'],['today','to class','at that time','to the appointment'],'I can’t make it ______.'],
    ['p-i-managed-to','I managed to + Verb...','Say you succeeded in doing something.','I managed to + base verb.','Useful to share progress.',['I managed to finish the module.','I managed to book the appointment.','I managed to understand most of it.','I managed to drive there.'],['finish the module','book the appointment','understand it','drive there'],'I managed to ______.'],
    ['p-i-ended-up','I ended up + Verb-ing...','Say what finally happened.','I ended up + verb-ing.','Natural in storytelling.',['I ended up staying home.','I ended up calling the clinic.','I ended up asking my teacher.','I ended up doing it online.'],['staying home','calling the clinic','asking my teacher','doing it online'],'I ended up ______.'],
    ['p-it-took-me','It took me + Time + to Verb...','Say how long something required.','It took me + time + to verb.','Useful for describing effort and time.',['It took me an hour to finish it.','It took me a while to understand.','It took me two weeks to settle in.','It took me ten minutes to get there.'],['an hour to finish','a while to understand','two weeks to settle in','ten minutes to get there'],'It took me ______ to ______.']
  );
  return rows.map(r=>({id:r[0], pattern:r[1], meaning:r[2], grammar:r[3], usage:r[4], examples:r[5], replace:r[6], buildPrompt:r[7]}));
}

function prepareAllItems(){
  allItems = []; itemsMap = {};
  // Pattern Study is the only scheduled learning module.
  ensurePatternData().forEach(pattern=>{
    const item={
      id:'pattern-'+pattern.id,
      english:pattern.pattern,
      chinese:chinesePatternMeaning(pattern),
      module:'patterns',
      patternId:pattern.id,
      isPattern:true
    };
    allItems.push(item); itemsMap[item.id]=item;
  });
  // Learned Quick Add sentences remain in the personal library and unified review system.
  loadCustomItems().filter(item=>item.module==='quickadd' || item.category==='quickadd').forEach((item,index)=>{
    const obj=Object.assign({},item,{module:'quickadd',category:'quickadd'});
    if(!obj.id) obj.id='quick-learned-'+(index+1);
    allItems.push(obj); itemsMap[obj.id]=obj;
  });
  // Pending Quick Add items are searchable, but do not enter Today's Plan or Review until learned.
  loadQuickAddPending().forEach((item,index)=>{
    const obj=Object.assign({},item,{module:'quickadd-pending',category:'quickadd-pending'});
    if(!obj.id) obj.id='quick-pending-'+(index+1);
    allItems.push(obj); itemsMap[obj.id]=obj;
  });
}
function getItemById(id){ if(!itemsMap[id]) prepareAllItems(); return itemsMap[id] || null; }
function moduleOfItem(item){ return item ? (item.module || item.category || '') : ''; }
function isMastered(id){ const r=getReview(id); return !!(r && (r.reviewLevel ?? r.stage ?? 0) >= REVIEW_INTERVALS.length); }
function isAllowedReviewItem(id){
  const item=getItemById(id);
  return !!item && ['patterns','quickadd'].includes(moduleOfItem(item));
}

function addToReview(id){
  const reviews = loadReviews();
  const now = todayMidnight().getTime();
  if(!reviews[id]){
    reviews[id] = { reviewLevel:0, stage:0, learnDate:now, nextReviewDate:addDays(now, REVIEW_INTERVALS[0]), nextReview:addDays(now, REVIEW_INTERVALS[0]), count:0 };
  }
  saveReviews(reviews);
}
function completeReview(id){
  const reviews = loadReviews();
  const now = todayMidnight().getTime();
  if(!reviews[id]){ addToReview(id); return; }
  const rec = reviews[id];
  const current = typeof rec.reviewLevel==='number' ? rec.reviewLevel : (rec.stage||0);
  const nextLevel = Math.min(current+1, REVIEW_INTERVALS.length);
  rec.reviewLevel = nextLevel; rec.stage = nextLevel; rec.count = (rec.count||0)+1;
  if(nextLevel >= REVIEW_INTERVALS.length){
    rec.nextReviewDate = 0; rec.nextReview = 0;
  } else {
    rec.nextReviewDate = addDays(now, REVIEW_INTERVALS[nextLevel]);
    rec.nextReview = rec.nextReviewDate;
  }
  reviews[id]=rec; saveReviews(reviews);
}
function markMastered(id){
  const reviews=loadReviews(); const now=todayMidnight().getTime();
  reviews[id] = Object.assign({}, reviews[id]||{}, {reviewLevel:REVIEW_INTERVALS.length, stage:REVIEW_INTERVALS.length, learnDate:(reviews[id]&&reviews[id].learnDate)||now, nextReviewDate:0, nextReview:0});
  saveReviews(reviews);
}
function undoMastered(id){ const reviews=loadReviews(); if(reviews[id]){ delete reviews[id]; saveReviews(reviews); } }

function dueReviewIds(){
  prepareAllItems();
  const reviews=loadReviews();
  const today=todayMidnight().getTime();
  return Object.keys(reviews).filter(id=>{
    if(!isAllowedReviewItem(id)) return false;
    const rec=reviews[id];
    const level=typeof rec.reviewLevel==='number' ? rec.reviewLevel : (rec.stage||0);
    const next=rec.nextReviewDate || rec.nextReview || 0;
    return level < REVIEW_INTERVALS.length && next <= today;
  });
}
function newPatternIds(){
  prepareAllItems();
  const reviews=loadReviews();
  return allItems.filter(item=>moduleOfItem(item)==='patterns' && !reviews[item.id]).map(item=>item.id);
}

function generatePlanTasks(force=false){
  const todayS=dateStr();
  const settings=loadPlanSettings();
  let tasks=loadPlanTasks();
  if(!force && tasks.date===todayS && tasks.plan && tasks.plan.patterns && tasks.review){
    // Migrate older plans by retaining only Pattern Study.
    tasks.plan={patterns:tasks.plan.patterns};
    // Keep today's plan stable. Only overdue reviews may accumulate without clearing progress.
    const due=dueReviewIds();
    const completedReviewIds=new Set(tasks.review.completedIds || []);
    const existing=[...(tasks.review.list || [])];
    due.forEach(id=>{ if(!existing.includes(id) && !completedReviewIds.has(id)) existing.push(id); });
    tasks.review.list=existing.filter(id=>isAllowedReviewItem(id));
    tasks.review.target=tasks.review.list.length;
    tasks.review.completed=Math.min(tasks.review.completed||0,tasks.review.list.length);
    savePlanTasks(tasks);
    return tasks;
  }
  const patternList=newPatternIds().slice(0,settings.patterns);
  const reviewList=dueReviewIds();
  tasks={
    date:todayS,
    plan:{patterns:{target:settings.patterns,list:patternList,completed:0,completedIds:[]}},
    review:{target:reviewList.length,list:reviewList,completed:0,completedIds:[]},
    completed:false
  };
  savePlanTasks(tasks);
  return tasks;
}

function updateCurrentPlanSettings(){
  const todayS=dateStr();
  const settings=loadPlanSettings();
  let tasks=loadPlanTasks();
  if(tasks.date!==todayS || !tasks.plan || !tasks.plan.patterns){ generatePlanTasks(true); return; }
  const seg=tasks.plan.patterns;
  const completedIds=new Set(seg.completedIds || []);
  const available=newPatternIds().filter(id=>!completedIds.has(id));
  const desired=Math.max(settings.patterns,seg.completed||0);
  const needed=Math.max(0,desired-(seg.completed||0));
  seg.target=settings.patterns;
  seg.list=available.slice(0,needed);
  seg.completed=Math.min(seg.completed||0,settings.patterns);
  tasks.plan={patterns:seg};
  savePlanTasks(tasks);
}
function completePlanCheck(tasks){
  const p=tasks.plan.patterns;
  const total=(p.list.length)+(tasks.review?.list?.length||0);
  const done=(p.completed||0)+(tasks.review?.completed||0);
  const allDone=total>0 && done>=total;
  if(allDone && !tasks.completed){
    tasks.completed=true;
    const info=loadDailyInfo(); const todayS=dateStr();
    if(info.lastCompletionDate!==todayS){
      const y=todayMidnight(); y.setDate(y.getDate()-1); const ys=dateStr(y);
      info.streak=info.lastCompletionDate===ys ? (info.streak||0)+1 : 1;
      info.lastCompletionDate=todayS; saveDailyInfo(info);
    }
  }
  savePlanTasks(tasks);
}
function incrementSegment(module,id){
  const tasks=generatePlanTasks();
  if(module!=='patterns') return;
  const seg=tasks.plan.patterns;
  seg.completedIds=seg.completedIds||[];
  if(id && !seg.completedIds.includes(id)) seg.completedIds.push(id);
  seg.completed=Math.min((seg.completed||0)+1,seg.list.length);
  completePlanCheck(tasks); updatePlanUI(); updateStatsUI();
}
function incrementReviewSegment(id){
  const tasks=generatePlanTasks();
  tasks.review.completedIds=tasks.review.completedIds||[];
  if(id && !tasks.review.completedIds.includes(id)) tasks.review.completedIds.push(id);
  tasks.review.completed=Math.min((tasks.review.completed||0)+1,tasks.review.list.length);
  completePlanCheck(tasks); updatePlanUI(); updateStatsUI();
}
function updatePlanUI(){
  const tasks=generatePlanTasks();
  const p=tasks.plan.patterns;
  const patternEl=document.getElementById('plan-patterns-progress');
  if(patternEl) patternEl.textContent=`${p.completed||0} / ${p.list.length||0}`;
  const reviewEl=document.getElementById('plan-review-progress');
  if(reviewEl) reviewEl.textContent=`${tasks.review.completed||0} / ${tasks.review.list.length||0}`;
  const total=(p.list.length||0)+(tasks.review.list.length||0);
  const done=(p.completed||0)+(tasks.review.completed||0);
  const totalEl=document.getElementById('plan-total-progress');
  if(totalEl) totalEl.textContent=total?Math.round(done/total*100)+'%':'0%';
  const startBtn=document.getElementById('start-today-btn');
  if(startBtn) startBtn.textContent=done>0?'Continue Learning':'Start Today';
}

function updateStatsUI(){
  prepareAllItems();
  const reviews=loadReviews(); let learned=0, review=0, mastered=0;
  Object.keys(reviews).forEach(id=>{ if(!isAllowedReviewItem(id)) return; const r=reviews[id]; learned++; const lvl=typeof r.reviewLevel==='number'?r.reviewLevel:(r.stage||0); if(lvl>=REVIEW_INTERVALS.length) mastered++; else review++; });
  const ids=[['stat-learned',learned],['stat-review',review],['stat-mastered',mastered],['stat-streak',loadDailyInfo().streak||0]];
  ids.forEach(([id,val])=>{ const el=document.getElementById(id); if(el) el.textContent=val; });
  const pm=document.getElementById('stat-patterns-mastered'); if(pm) pm.textContent=patternsMasteredCount();
  // Save daily history for analytics
  const hist=safeJSON(STATS_HISTORY_KEY,{}); hist[dateStr()]={learned,review,mastered,due:dueReviewIds().length}; saveJSON(STATS_HISTORY_KEY,hist);
}

function updateVoiceList(){
  const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
  const desired = selectedVoiceCode==='au'?'en-AU':selectedVoiceCode==='uk'?'en-GB':'en-US';
  selectedVoice = voices.find(v=>v.lang===desired) || voices.find(v=>v.lang&&v.lang.startsWith('en')) || null;
}
function speak(text){ if(!('speechSynthesis' in window) || !text) return; speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); if(selectedVoice){u.voice=selectedVoice; u.lang=selectedVoice.lang;} else u.lang='en-AU'; u.rate=0.95; speechSynthesis.speak(u); }
function formatDate(time){ if(!time) return ''; return new Date(time).toLocaleDateString(); }

function chinesePatternMeaning(pattern){
  const map={
    'p-have-you-been-ving':'询问最近一段时间持续发生的事情。',
    'p-have-you-past':'询问某件事是否已经发生或完成。',
    'p-id-like-to':'礼貌地表达自己想做什么。',
    'p-im-looking-for':'说明自己正在找某个地方或东西。',
    'p-could-you-please':'礼貌地请求别人帮忙做某事。',
    'p-would-you-mind':'非常礼貌地询问别人是否介意做某事。',
    'p-can-i':'询问自己是否可以做某事。',
    'p-do-you':'询问对方是否有某种习惯、服务或情况。',
    'p-how-long':'询问一件事情需要多长时间。',
    'p-when-can':'询问什么时候可以做某事或得到结果。',
    'p-is-there':'询问是否有某个东西、地方或可能性。',
    'p-there-is-are':'说明某处有某个东西或某种情况。',
    'p-let-me':'表示让我来做某事。',
    'p-i-need-to':'表达自己需要做某事。',
    'p-im-going-to':'表达自己接下来打算做什么。',
    'p-im-adjective':'表达自己现在的感觉或状态。',
    'p-be-adjective':'描述人或事物的状态。',
    'p-general-statement':'表达一个简单、完整的想法。'
  };
  return pattern.chineseMeaning || map[pattern.id] || '帮助你快速组成完整句子。';
}

function exampleChinese(text){
  const map={
    'Have you been sleeping well?':'你最近睡得好吗？','Have you been eating normally?':'你最近饮食正常吗？','Have you been coughing?':'你最近一直咳嗽吗？','Have you been vomiting?':'你最近有呕吐吗？','Have you been exercising?':'你最近有运动吗？','Have you been feeling dizzy?':'你最近感觉头晕吗？','Have you been passing urine normally?':'你最近小便正常吗？','Have you been drinking enough water?':'你最近有喝足够的水吗？','Have you been taking your medication?':'你最近有按时服药吗？','Have you been opening your bowels regularly?':'你最近大便规律吗？','Have you been feeling short of breath?':'你最近感觉气短吗？','Have you been working late?':'你最近工作到很晚吗？','Have you been studying much?':'你最近学习很多吗？',
    'Have you taken your medication?':'你吃药了吗？','Have you seen a GP?':'你看过全科医生了吗？','Have you finished the form?':'你填完表了吗？','Have you booked the appointment?':'你预约了吗？','Have you had lunch?':'你吃午饭了吗？',
    "I'd like to return this item.":'我想退这个东西。',"I'd like to make an appointment.":'我想预约。',"I'd like to speak to Mandy's educator.":'我想和 Mandy 的老师聊一下。',"I'd like to ask about my placement.":'我想问一下我的实习。',"I'd like to update my address.":'我想更新我的地址。',
    "I'm looking for the pharmacy.":'我在找药房。',"I'm looking for the supermarket.":'我在找超市。',"I'm looking for my daughter.":'我在找我女儿。',"I'm looking for room 204.":'我在找 204 房间。',"I'm looking for the student services desk.":'我在找学生服务处。',
    'Could you please repeat that?':'你可以重复一遍吗？','Could you please speak a bit slower?':'你可以说慢一点吗？','Could you please help me with this form?':'你可以帮我看一下这个表吗？','Could you please call me if she gets worse?':'如果她情况变差，你可以打电话给我吗？','Could you please encourage her to drink more water?':'你可以鼓励她多喝水吗？',
    'Can I pay by card?':'我可以刷卡付款吗？','Can I ask a quick question?':'我可以问个小问题吗？','Can I book an appointment?':'我可以预约吗？','Can I speak to the educator?':'我可以和老师说话吗？','Can I have a receipt?':'我可以要一张收据吗？',
    'Do you have any children?':'你有孩子吗？','Do you take card?':'你们可以刷卡吗？','Do you offer bulk billing?':'你们提供医保全报销吗？','Do you live nearby?':'你住在附近吗？','Do you know where the office is?':'你知道办公室在哪里吗？',
    'How long will it take to process?':'处理需要多长时间？','How long will it take to get there?':'到那里需要多长时间？','How long will the appointment take?':'预约会需要多长时间？','How long will it take for her to settle?':'她适应下来需要多久？'
  };
  return map[text] || '';
}

function shortMeaningForItem(item){
  if(item.meaning) return item.meaning;
  const map={
    'a bit tired':'slightly tired / a little tired','take a rain check':'politely say you want to do it another time','keep up with':'stay at the same speed or level','be used to':'be familiar with something','get used to':'gradually become familiar with something','settle in':'become comfortable in a new place','pick it up':'collect it or learn it','drop her off':'take her somewhere and leave her there','pick her up':'collect her from somewhere','check in at reception':'tell reception you have arrived','take your medication':'take medicine as instructed','pass urine':'wee / urinate','feel dizzy':'feel like you may lose balance',
    'receipt':'proof of payment','roster':'a work or study schedule','bulk billing':'medical cost covered directly by Medicare','rego':'vehicle registration','trolley':'shopping cart','footpath':'path for walking beside the road','bin':'rubbish container','surcharge':'an extra fee added to the normal price','servo':'petrol station','mozzie':'mosquito','tradie':'tradesperson'
  };
  return map[(item.english||'').toLowerCase()] || 'a useful English item for daily communication';
}

function exampleChineseFallback(text){
  const map={
    'I’m a bit tired after placement.':'实习后我有点累。','She looks a bit tired today.':'她今天看起来有点累。','Can I take a rain check?':'我可以下次再约吗？','Let’s take a rain check and catch up next week.':'我们改天再约，下周见吧。','It is hard to keep up with the workload.':'要跟上学习量很难。','I’m trying to keep up with the class.':'我在努力跟上课程。','I’m used to the routine now.':'我现在习惯这个日常安排了。','She is used to childcare.':'她已经习惯幼儿园了。','I’m getting used to the accent.':'我正在慢慢适应这个口音。','It takes time to get used to a new place.':'适应一个新地方需要时间。','How is she settling in?':'她适应得怎么样？','I’m still settling in at uni.':'我还在适应大学生活。','I’ll pick it up after class.':'我下课后去取。','She picked it up quickly.':'她很快就学会了。','I drop her off at childcare in the morning.':'我早上送她去幼儿园。','My husband will drop her off tomorrow.':'我丈夫明天会送她去。','I’ll pick her up early today.':'我今天会早点接她。',
    'Keep the receipt as proof of purchase.':'保留收据作为购买凭证。','Can I have a receipt, please?':'可以给我一张收据吗？','I checked my roster for next week.':'我看了下周的排班表。','My roster changed at the last minute.':'我的排班临时改了。','Is there a surcharge for card payments?':'刷卡有手续费吗？','There is a 1.5% surcharge on weekends.':'周末有 1.5% 的附加费。','I stopped at the servo for petrol.':'我在加油站停下来加油。','Put on spray to keep mozzies away.':'喷点防蚊喷雾，别让蚊子靠近。'
  };
  return map[text] || '';
}

function createNoteEditor(ownerId){
  const wrap=document.createElement('div'); wrap.className='note-wrap';
  const btn=document.createElement('button'); btn.className='note-btn';
  const existing=getNote(ownerId);
  btn.textContent = existing ? '📝 Note' : '+ Note';
  wrap.appendChild(btn);
  const box=document.createElement('textarea'); box.className='note-box'; box.placeholder='Personal note...'; box.value=existing; box.style.display='none';
  wrap.appendChild(box);
  btn.addEventListener('click',()=>{ box.style.display = box.style.display==='none' ? 'block' : 'none'; });
  box.addEventListener('input',()=>{ setNote(ownerId, box.value); btn.textContent = box.value.trim() ? '📝 Note' : '+ Note'; });
  return wrap;
}

function createPatternMini(pattern){
  if(!pattern) return null;
  const block=document.createElement('div'); block.className='pattern-mini';
  const title=document.createElement('p'); title.innerHTML='<strong>Sentence Pattern</strong>'; block.appendChild(title);
  const p=document.createElement('div'); p.className='pattern-line'; p.textContent=pattern.pattern; block.appendChild(p);
  const meaning=document.createElement('p'); meaning.className='pattern-meaning'; meaning.textContent='中文解释：'+chinesePatternMeaning(pattern); block.appendChild(meaning);
  return block;
}

function createCard(item, onAction=null, autoplay=false){
  const card=document.createElement('div'); card.className='phrase-card';
  const listen=document.createElement('button'); listen.className='listen-btn'; listen.textContent='🔊 Listen'; listen.addEventListener('click',()=>speak(item.english)); card.appendChild(listen);
  const en=document.createElement('h3'); en.textContent=item.english; card.appendChild(en);
  if(item.pronunciation){ const pr=document.createElement('p'); pr.className='pronunciation'; pr.textContent='Pronunciation: '+item.pronunciation; card.appendChild(pr); }
  const chineseBtn=document.createElement('button'); chineseBtn.className='toggle-btn'; chineseBtn.textContent='Chinese'; card.appendChild(chineseBtn);
  const zh=document.createElement('p'); zh.className='translation'; zh.style.display='none'; zh.textContent=item.chinese||''; card.appendChild(zh);
  chineseBtn.addEventListener('click',()=>{ const show=zh.style.display==='none'||!zh.style.display; zh.style.display=show?'block':'none'; chineseBtn.textContent=show?'English':'Chinese'; });
  if(item.example1 || item.example2){ const ex=document.createElement('div'); ex.className='examples'; [item.example1,item.example2].filter(Boolean).forEach(t=>{ const p=document.createElement('p'); p.className='example'; p.textContent=t; ex.appendChild(p); }); card.appendChild(ex); }
  if(item.scenario && moduleOfItem(item)==='smalltalk'){ const sc=document.createElement('p'); sc.className='usage'; sc.textContent='Usage: '+item.scenario; card.appendChild(sc); }
  card.appendChild(createNoteEditor(item.id));
  const actions=document.createElement('div'); actions.className='card-actions';
  const rec=getReview(item.id);
  if(rec && (rec.reviewLevel ?? rec.stage ?? 0) >= REVIEW_INTERVALS.length){
    const undo=document.createElement('button'); undo.className='undo-master-btn'; undo.textContent='↩ Undo Mastered'; undo.addEventListener('click',()=>{ undoMastered(item.id); if(onAction) onAction('undo'); else if(window.currentPageRender) window.currentPageRender(); }); actions.appendChild(undo);
  } else {
    const reviewBtn=document.createElement('button'); reviewBtn.className='add-review-btn'; reviewBtn.textContent='❤️ Review';
    reviewBtn.addEventListener('click',()=>{ if(rec && (rec.nextReviewDate||rec.nextReview||0)<=todayMidnight().getTime()) completeReview(item.id); else addToReview(item.id); if(onAction) onAction('review'); else if(window.currentPageRender) window.currentPageRender(); });
    actions.appendChild(reviewBtn);
    const masterBtn=document.createElement('button'); masterBtn.className='master-btn'; masterBtn.textContent='✅ Mastered'; masterBtn.addEventListener('click',()=>{ markMastered(item.id); if(onAction) onAction('mastered'); else if(window.currentPageRender) window.currentPageRender(); }); actions.appendChild(masterBtn);
  }
  card.appendChild(actions);
  if(autoplay) setTimeout(()=>speak(item.english),120);
  return card;
}

function patternPracticeItems(pattern){
  const map={
    'p-have-you-been-ving':[
      {prompt:'你最近有没有喝足够的水？', answer:'Have you been drinking enough water?'},
      {prompt:'你最近有没有按时吃药？', answer:'Have you been taking your medication on time?'}
    ],
    'p-have-you-past':[
      {prompt:'你有没有收到学校的邮件？', answer:'Have you received the email from the university?'},
      {prompt:'你有没有提交那个表格？', answer:'Have you submitted the form?'}
    ],
    'p-id-like-to':[
      {prompt:'我想预约一下。', answer:"I'd like to make an appointment."},
      {prompt:'我想问一下我的实习。', answer:"I'd like to ask about my placement."}
    ],
    'p-im-looking-for':[
      {prompt:'我在找学生服务处。', answer:"I'm looking for the student services desk."},
      {prompt:'我在找最近的药房。', answer:"I'm looking for the nearest pharmacy."}
    ],
    'p-could-you-please':[
      {prompt:'你可以再说慢一点吗？', answer:'Could you please speak a bit slower?'},
      {prompt:'你可以帮我检查一下这个表吗？', answer:'Could you please check this form for me?'}
    ],
    'p-would-you-mind':[
      {prompt:'你介意等我一分钟吗？', answer:'Would you mind waiting for a minute?'},
      {prompt:'你介意帮我看一下这个吗？', answer:'Would you mind checking this for me?'}
    ],
    'p-can-i':[
      {prompt:'我可以问一个问题吗？', answer:'Can I ask a question?'},
      {prompt:'我可以刷卡付款吗？', answer:'Can I pay by card?'}
    ],
    'p-do-you':[
      {prompt:'你们提供医保全报销吗？', answer:'Do you offer bulk billing?'},
      {prompt:'你住在这附近吗？', answer:'Do you live nearby?'}
    ],
    'p-how-long':[
      {prompt:'这个预约需要多长时间？', answer:'How long will the appointment take?'},
      {prompt:'结果出来需要多久？', answer:'How long will it take for the result to come back?'}
    ],
    'p-when-can':[
      {prompt:'我什么时候可以拿到结果？', answer:'When can I get the result?'},
      {prompt:'我什么时候可以再来？', answer:'When can I come back?'}
    ]
,
    'p-is-there':[
      {prompt:'附近有药房吗？', answer:'Is there a pharmacy nearby?'},
      {prompt:'这里有厕所吗？', answer:'Is there a toilet here?'}
    ],
    'p-there-is-are':[
      {prompt:'今天有一个新通知。', answer:'There is a new notice today.'},
      {prompt:'书包里有两件备用衣服。', answer:'There are two spare outfits in the bag.'}
    ],
    'p-let-me':[
      {prompt:'让我确认一下时间。', answer:'Let me check the time.'},
      {prompt:'让我把这个写下来。', answer:'Let me write this down.'}
    ],
    'p-i-need-to':[
      {prompt:'我需要更新我的地址。', answer:'I need to update my address.'},
      {prompt:'我需要预约医生。', answer:'I need to book a GP appointment.'}
    ],
    'p-im-going-to':[
      {prompt:'我准备今天早点接她。', answer:"I'm going to pick her up early today."},
      {prompt:'我准备课后去图书馆。', answer:"I'm going to go to the library after class."}
    ],
    'p-im-adjective':[
      {prompt:'我有点紧张。', answer:"I'm a bit nervous."},
      {prompt:'我对这门课很兴奋。', answer:"I'm excited about this course."}
    ],
    'p-be-adjective':[
      {prompt:'她今天有点累。', answer:'She is a bit tired today.'},
      {prompt:'这个表格很重要。', answer:'This form is important.'}
    ],
    'p-general-statement':[
      {prompt:'我住在 Wodonga。', answer:'I live in Wodonga.'},
      {prompt:'我的女儿上幼儿园。', answer:'My daughter goes to childcare.'}
    ]  };
  return map[pattern.id] || [
    {prompt:'请用这个结构表达一个你今天会用到的想法。', answer:pattern.pattern.replace(/\+.*|\.\.\./g,'').trim() + ' ...'},
    {prompt:'请用这个结构表达一个真实生活场景。', answer:pattern.pattern.replace(/\+.*|\.\.\./g,'').trim() + ' ...'}
  ];
}

function createPatternCard(pattern, onAction=null){
  const card=document.createElement('div'); card.className='phrase-card pattern-card';
  const label=document.createElement('p'); label.innerHTML='<strong>Pattern</strong>'; card.appendChild(label);
  const h=document.createElement('h3'); h.textContent=pattern.pattern; card.appendChild(h);
  const m=document.createElement('p'); m.className='pattern-meaning'; m.textContent='中文解释：'+chinesePatternMeaning(pattern); card.appendChild(m);

  const fam=document.createElement('div'); fam.className='pattern-family';
  const title=document.createElement('p'); title.innerHTML='<strong>Pattern Family Examples</strong>'; fam.appendChild(title);
  const list=document.createElement('div'); list.className='pattern-example-list';
  const showBtn=document.createElement('button'); showBtn.className='toggle-btn'; showBtn.textContent='Show Chinese';
  let showChinese=false;
  function renderExamples(){
    list.innerHTML='';
    (pattern.examples||[]).forEach(ex=>{
      const row=document.createElement('div'); row.className='pattern-example-row';
      const speakBtn=document.createElement('button'); speakBtn.className='inline-audio'; speakBtn.textContent='🔊'; speakBtn.title='Listen'; speakBtn.addEventListener('click',()=>speak(ex)); row.appendChild(speakBtn);
      const textWrap=document.createElement('div');
      const en=document.createElement('p'); en.className='pattern-example-en'; en.textContent=ex; textWrap.appendChild(en);
      if(showChinese){ const cn=document.createElement('p'); cn.className='pattern-example-cn'; cn.textContent=exampleChinese(ex) || ''; textWrap.appendChild(cn); }
      row.appendChild(textWrap); list.appendChild(row);
    });
  }
  showBtn.addEventListener('click',()=>{ showChinese=!showChinese; showBtn.textContent=showChinese?'Hide Chinese':'Show Chinese'; renderExamples(); });
  renderExamples(); fam.appendChild(list); fam.appendChild(showBtn); card.appendChild(fam);

  const practice=document.createElement('div'); practice.className='translation-practice';
  const practiceTitle=document.createElement('p'); practiceTitle.innerHTML='<strong>Translation Practice</strong>'; practice.appendChild(practiceTitle);
  const instruction=document.createElement('p'); instruction.textContent='Translate using this pattern:'; practice.appendChild(instruction);
  patternPracticeItems(pattern).forEach((practiceItem, index)=>{
    const block=document.createElement('div'); block.className='translation-practice-item';
    const prompt=document.createElement('p'); prompt.className='translation-prompt'; prompt.textContent=(index+1)+'. '+practiceItem.prompt; block.appendChild(prompt);
    const input=document.createElement('input'); input.className='practice-input'; input.placeholder='Type your English sentence here...'; input.value=getPractice(pattern.id+'-'+index); input.addEventListener('input',()=>setPractice(pattern.id+'-'+index, input.value)); block.appendChild(input);
    const answer=document.createElement('p'); answer.className='practice-answer'; answer.style.display='none'; answer.textContent=practiceItem.answer;
    const answerBtn=document.createElement('button'); answerBtn.className='toggle-btn'; answerBtn.textContent='Show Answer'; answerBtn.addEventListener('click',()=>{ const show=answer.style.display==='none'; answer.style.display=show?'block':'none'; answerBtn.textContent=show?'Hide Answer':'Show Answer'; });
    block.appendChild(answerBtn); block.appendChild(answer); practice.appendChild(block);
  });
  card.appendChild(practice);
  card.appendChild(createNoteEditor('pattern-'+pattern.id));

  const actions=document.createElement('div'); actions.className='card-actions';
  const id='pattern-'+pattern.id; const rec=getReview(id);
  if(rec && (rec.reviewLevel ?? rec.stage ?? 0) >= REVIEW_INTERVALS.length){
    const undo=document.createElement('button'); undo.className='undo-master-btn'; undo.textContent='↩ Undo Mastered'; undo.addEventListener('click',()=>{ undoMastered(id); if(onAction) onAction('undo'); else if(window.currentPageRender) window.currentPageRender(); }); actions.appendChild(undo);
  } else {
    const r=document.createElement('button'); r.className='add-review-btn'; r.textContent='❤️ Review Pattern'; r.addEventListener('click',()=>{ if(rec && (rec.nextReviewDate||rec.nextReview||0)<=todayMidnight().getTime()) completeReview(id); else addToReview(id); if(onAction) onAction('review'); else if(window.currentPageRender) window.currentPageRender(); }); actions.appendChild(r);
    const master=document.createElement('button'); master.className='master-btn'; master.textContent='✅ Mastered Pattern'; master.addEventListener('click',()=>{ markMastered(id); if(onAction) onAction('mastered'); else if(window.currentPageRender) window.currentPageRender(); }); actions.appendChild(master);
  }
  card.appendChild(actions); return card;
}

function startTodayStudyPlan(){
  const container=document.getElementById('today-study-container');
  const planSection=document.querySelector('.today-plan');
  const quickSection=document.querySelector('.home-quick-add');
  if(!container) return;
  const tasks=generatePlanTasks();
  const queue=[];
  const patternCompleted=tasks.plan.patterns.completedIds||[];
  (tasks.plan.patterns.list||[]).filter(id=>!patternCompleted.includes(id)).forEach(id=>queue.push({id,type:'pattern'}));
  const reviewCompleted=tasks.review.completedIds||[];
  (tasks.review.list||[]).filter(id=>!reviewCompleted.includes(id)).forEach(id=>queue.push({id,type:'review'}));
  if(planSection) planSection.style.display='none';
  if(quickSection) quickSection.style.display='none';
  container.style.display='block';
  let index=0;
  function next(){
    if(index>=queue.length){
      container.innerHTML='<div class="completion-card"><h2>✅ Today’s Pattern Practice Completed</h2><p><a class="btn" href="index.html">Back Home</a></p></div>';
      updatePlanUI(); updateStatsUI(); return;
    }
    const current=queue[index]; container.innerHTML='';
    if(current.type==='pattern'){
      const pattern=getPatternById(current.id.replace('pattern-',''));
      if(!pattern){ index++; next(); return; }
      container.appendChild(createPatternCard(pattern,(action)=>{
        // createPatternCard already updates the review/mastered record.
        incrementSegment('patterns',current.id);
        index++; next();
      }));
    } else {
      const item=getItemById(current.id);
      if(!item){ index++; next(); return; }
      const done=()=>{ incrementReviewSegment(current.id); index++; next(); };
      if(moduleOfItem(item)==='patterns'){
        const pattern=getPatternById(current.id.replace('pattern-',''));
        container.appendChild(pattern?createPatternCard(pattern,done):createCard(item,done,true));
      } else container.appendChild(createCard(item,done,true));
    }
  }
  next();
}

function renderQuickAddList(){
  const list=document.getElementById('quick-add-list');
  const startBtn=document.getElementById('quick-add-start-btn');
  if(!list) return;
  const pending=loadQuickAddPending();
  list.innerHTML='';
  if(!pending.length){ list.innerHTML='<p>No pending Quick Add sentences.</p>'; if(startBtn) startBtn.style.display='none'; return; }
  if(startBtn) startBtn.style.display='inline-block';
  pending.forEach(item=>{
    const card=document.createElement('div'); card.className='phrase-card quickadd-pending-card';
    const created=item.createdDate?new Date(item.createdDate).toLocaleDateString():'';
    card.innerHTML=`<h3>${escapeHTML(item.english)}</h3><p class="translation" style="display:block">${escapeHTML(item.chinese||'')}</p><p><strong>Created:</strong> ${created}</p>${item.note?`<p><strong>Note:</strong> ${escapeHTML(item.note)}</p>`:''}`;
    list.appendChild(card);
  });
}
function escapeHTML(value){ return String(value||'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }
function promoteQuickAddItem(item){
  const custom=loadCustomItems();
  const promoted=Object.assign({},item,{module:'quickadd',category:'quickadd'});
  if(!custom.some(x=>x.id===item.id)) custom.push(promoted);
  saveCustomItems(custom);
  saveQuickAddPending(loadQuickAddPending().filter(x=>x.id!==item.id));
  prepareAllItems();
}
function startQuickAddLearning(){
  const container=document.getElementById('quick-add-study-container');
  const formSection=document.querySelector('.quick-add-section');
  const pendingSection=document.querySelector('.quick-add-learning-list');
  if(!container) return;
  const queue=loadQuickAddPending();
  if(!queue.length){ renderQuickAddList(); return; }
  if(formSection) formSection.style.display='none';
  if(pendingSection) pendingSection.style.display='none';
  container.style.display='block';
  let i=0;
  function next(){
    if(i>=queue.length){ container.innerHTML='<p>✅ Quick Add Learning Completed</p><p>These sentences are now in your personal review library.</p><p><a class="btn" href="quickadd.html">Back to Quick Add</a></p>'; updateStatsUI(); return; }
    const item=queue[i]; container.innerHTML='';
    container.appendChild(createCard(item,(action)=>{
      promoteQuickAddItem(item);
      if(action==='mastered') markMastered(item.id); else addToReview(item.id);
      i++; next();
    },true));
  }
  next();
}
function initQuickAddPage(){
  const form=document.getElementById('quick-add-form'); renderQuickAddList();
  const startBtn=document.getElementById('quick-add-start-btn'); if(startBtn) startBtn.addEventListener('click',startQuickAddLearning);
  if(!form) return;
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const english=document.getElementById('qa-english').value.trim();
    const chinese=document.getElementById('qa-chinese').value.trim();
    const note=document.getElementById('qa-note')?.value.trim()||'';
    if(!english||!chinese){ alert('Please enter both English and Chinese.'); return; }
    const id='quick-'+Date.now();
    const item={id,english,chinese,note,module:'quickadd-pending',category:'quickadd-pending',createdDate:new Date().toISOString()};
    if(note) setNote(id,note);
    const pending=loadQuickAddPending(); pending.push(item); saveQuickAddPending(pending);
    form.reset(); renderQuickAddList(); alert('Saved to Quick Add.');
  });
}

function initSettingsPage(){
  const form=document.getElementById('task-settings-form'); if(!form) return; const s=loadPlanSettings();
  const map={patterns:'setting-patterns'};
  Object.keys(map).forEach(k=>{ const el=document.getElementById(map[k]); if(el) el.value=s[k]; });
  form.addEventListener('submit',e=>{ e.preventDefault(); const ns={}; Object.keys(map).forEach(k=>{ const el=document.getElementById(map[k]); ns[k]=parseInt(el.value,10)||0; }); savePlanSettings(ns); updateCurrentPlanSettings(); updatePlanUI(); alert('Settings saved!'); });
  const exp=document.getElementById('export-data-btn'); const inp=document.getElementById('import-data-file'); const imp=document.getElementById('import-data-btn');
  if(exp) exp.addEventListener('click',()=>{ const data={}; for(let i=0;i<localStorage.length;i++){ const key=localStorage.key(i); if(key&&key.startsWith('efra_')) data[key]=localStorage.getItem(key); } const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='efra_backup_'+dateStr()+'.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); });
  if(imp&&inp){ imp.addEventListener('click',()=>inp.click()); inp.addEventListener('change',()=>{ const f=inp.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ const data=JSON.parse(r.result); Object.keys(data).forEach(k=>{ if(k.startsWith('efra_')) localStorage.setItem(k,data[k]); }); prepareAllItems(); updatePlanUI(); updateStatsUI(); alert('Data imported successfully!'); }catch(err){ alert('Failed to import data: '+err.message); } }; r.readAsText(f); }); }
}
function initReviewPage(){
  prepareAllItems();
  const todayEl=document.getElementById('review-today-list'), upcomingEl=document.getElementById('review-upcoming-list'), masteredEl=document.getElementById('review-mastered-list'), stats=document.getElementById('review-stats');
  function render(){
    prepareAllItems();
    const reviews=loadReviews(); const today=todayMidnight().getTime(); const todayIds=[],upcoming=[],mastered=[];
    Object.keys(reviews).forEach(id=>{
      if(!isAllowedReviewItem(id)) return;
      const rec=reviews[id]; const lvl=rec.reviewLevel??rec.stage??0; const next=rec.nextReviewDate||rec.nextReview||0;
      if(lvl>=REVIEW_INTERVALS.length) mastered.push(id); else if(next<=today) todayIds.push(id); else upcoming.push(id);
    });
    function fill(el,ids,empty){
      if(!el) return; el.innerHTML='';
      if(!ids.length){ el.innerHTML='<p>'+empty+'</p>'; return; }
      ids.forEach(id=>{
        const item=getItemById(id); if(!item) return;
        if(moduleOfItem(item)==='patterns'){
          const pattern=getPatternById(id.replace('pattern-',''));
          if(pattern) el.appendChild(createPatternCard(pattern,()=>render()));
        } else el.appendChild(createCard(item,()=>render()));
      });
    }
    fill(todayEl,todayIds,'No pattern or Quick Add reviews today.');
    fill(upcomingEl,upcoming,'No upcoming reviews.');
    fill(masteredEl,mastered,'No mastered items yet.');
    if(stats) stats.innerHTML=`<p>Pattern Library: ${ensurePatternData().length}</p><p>Due Today: ${todayIds.length}</p><p>Review Items: ${todayIds.length+upcoming.length}</p><p>Mastered: ${mastered.length}</p><p>Current Streak: ${loadDailyInfo().streak||0}</p>`;
  }
  window.currentPageRender=render; render();
}
function initSearchPage(){
  prepareAllItems();
  const input=document.getElementById('search-input'),results=document.getElementById('search-results'); if(!input||!results) return;
  input.addEventListener('input',()=>{
    const q=input.value.trim().toLowerCase(); results.innerHTML=''; if(!q) return;
    const found=allItems.filter(item=>['patterns','quickadd','quickadd-pending'].includes(moduleOfItem(item)) && ((item.english||'').toLowerCase().includes(q)||(item.chinese||'').includes(q)));
    if(!found.length){ results.innerHTML='<p>No results found.</p>'; return; }
    found.forEach(item=>{
      const module=moduleOfItem(item);
      if(module==='patterns'){
        const pattern=getPatternById(item.id.replace('pattern-','')); if(pattern) results.appendChild(createPatternCard(pattern));
      } else if(module==='quickadd-pending'){
        const card=document.createElement('div'); card.className='phrase-card';
        card.innerHTML=`<h3>${escapeHTML(item.english)}</h3><p>${escapeHTML(item.chinese||'')}</p><p><a class="btn" href="quickadd.html">Open Quick Add</a></p>`;
        results.appendChild(card);
      } else results.appendChild(createCard(item));
    });
  });
}

function initPatternsPage(){
  ensurePatternData();
  const container=document.getElementById('patterns-container');
  if(!container) return;
  function render(){ container.innerHTML=''; window.sentencePatterns.forEach(p=>container.appendChild(createPatternCard(p))); }
  window.currentPageRender=render; render();
}

function initNavigation(){ const btn=document.querySelector('.menu-toggle'), nav=document.querySelector('.nav-links'); if(btn&&nav) btn.addEventListener('click',()=>nav.classList.toggle('show-menu')); }
function initPWA(){ let deferredPrompt; const installButton=document.getElementById('install-button'); window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); deferredPrompt=e; if(installButton) installButton.style.display='inline-block'; }); if(installButton) installButton.addEventListener('click',async()=>{ if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; installButton.style.display='none'; }); if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(()=>{}); }

document.addEventListener('DOMContentLoaded',()=>{
  prepareAllItems(); initNavigation(); initPWA(); updateVoiceList(); if(speechSynthesis&&speechSynthesis.onvoiceschanged!==undefined) speechSynthesis.onvoiceschanged=updateVoiceList;
  const vs=document.getElementById('voice-select'); if(vs){ vs.value=selectedVoiceCode; vs.addEventListener('change',e=>{ selectedVoiceCode=e.target.value; localStorage.setItem(VOICE_KEY,selectedVoiceCode); updateVoiceList(); }); }
  const page=document.body.dataset.page || 'home';
  if(page==='patterns') initPatternsPage();
  else if(page==='quickadd') initQuickAddPage();
  else if(page==='settings') initSettingsPage();
  else if(page==='review') initReviewPage();
  else if(page==='search') initSearchPage();
  updatePlanUI(); updateStatsUI();
  const start=document.getElementById('start-today-btn'); if(start) start.addEventListener('click',startTodayStudyPlan);
});
