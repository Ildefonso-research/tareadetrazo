/********************* 
 * Test-de-Trazo *
 *********************/

import { core, data, sound, util, visual, hardware } from './lib/psychojs-2024.2.4.js';
const { PsychoJS } = core;
const { TrialHandler, MultiStairHandler } = data;
const { Scheduler } = util;

// Inicializar PsychoJS
const psychoJS = new PsychoJS({
  debug: true
});

// Configuración básica del experimento
let expName = 'TEST DE TRAZO'; // Nombre del experimento
let expInfo = {
    'Escribe tu correo electrónico, por favor': '' // Campo inicial vacío
};

// Activar el servidor y cargar configuraciones de EmailJS
let emailjsConfig = {};
fetch('https://tareadetrazo.onrender.com/get-email-config')
  .then(response => {
    if (!response.ok) {
      throw new Error('Fallo al obtener configuración del servidor.');
    }
    return response.json();
  })
  .then(config => {
    emailjsConfig = config; 
    emailjs.init(emailjsConfig.userID); 
  })
  .catch(error => {
    console.error('Error al cargar la configuración de EmailJS:', error);
    alert('No se pudo cargar la configuración del servidor. Por favor, intenta más tarde.');
  });

// Abrir la ventana del experimento
psychoJS.openWindow({
  fullscr: true,
  color: new util.Color([-0.67, -0.67, -0.67]),
  units: 'height',
  waitBlanking: true,
  backgroundImage: '',
  backgroundFit: 'none',
});

// Configuración del flujo del experimento
const flowScheduler = new Scheduler(psychoJS);
const dialogCancelScheduler = new Scheduler(psychoJS);

psychoJS.schedule(async () => {
  // Mostrar el cuadro de diálogo para introducir datos
  const dialogResult = await psychoJS.gui.DlgFromDict({
    dictionary: expInfo,
    title: expName
  });

  // Verificar si el usuario presionó "OK" o cerró el cuadro de diálogo
  if (dialogResult.button === 'OK') {
    const email = expInfo['Escribe tu correo electrónico, por favor'].trim();
    if (email === '') {
      alert('Por favor, introduce tu correo electrónico para continuar.');
      location.reload(); // Reiniciar el experimento si el correo está vacío
    } else {
      return Scheduler.Event.NEXT; // Continúa si el correo es válido
    }
  } else {
    quitPsychoJS('El usuario canceló el experimento.', false); // Salir si cancela
  }
});


// Validar el contenido del correo antes de continuar
psychoJS.schedule(() => {
  const email = expInfo['Escribe tu correo electrónico, por favor'].trim();
  if (email === '') {
    alert('Por favor, introduce tu correo electrónico para continuar.');
    return Scheduler.Event.QUIT; // Finaliza el flujo si el correo está vacío
  }
  return Scheduler.Event.NEXT; // Continúa si el correo es válido
});

// Configurar el flujo principal
flowScheduler.add(updateInfo); // Añadir timeStamp
flowScheduler.add(experimentInit);
flowScheduler.add(setupRoutineBegin());
flowScheduler.add(setupRoutineEachFrame());
flowScheduler.add(setupRoutineEnd());
const trialsLoopScheduler = new Scheduler(psychoJS);
flowScheduler.add(trialsLoopBegin(trialsLoopScheduler));
flowScheduler.add(trialsLoopScheduler);
flowScheduler.add(trialsLoopEnd);

flowScheduler.add(thanksRoutineBegin());
flowScheduler.add(thanksRoutineEachFrame());
flowScheduler.add(thanksRoutineEnd());
flowScheduler.add(endExperiment);
flowScheduler.add(quitPsychoJS, '', true);

// Configurar la cancelación en caso de que el cuadro de diálogo se cierre
dialogCancelScheduler.add(quitPsychoJS, '', false);

// Iniciar PsychoJS
psychoJS.start({
  expName: expName,
  expInfo: expInfo,
  resources: [
    {'name': 'conditions.xlsx', 'path': 'conditions.xlsx'},
  ]
});

psychoJS.experimentLogger.setLevel(core.Logger.ServerLevel.EXP);

// Funciones auxiliares
var currentLoop;
var frameDur;

async function updateInfo() {
  currentLoop = psychoJS.experiment; // Mantener referencias de bucles
  expInfo['date'] = util.MonotonicClock.getDateStr(); // Timestamp simple
  expInfo['expName'] = expName;
  expInfo['OS'] = window.navigator.platform;

  // Guardar la tasa de fotogramas
  expInfo['frameRate'] = psychoJS.window.getActualFrameRate();
  if (typeof expInfo['frameRate'] !== 'undefined') {
    frameDur = 1.0 / Math.round(expInfo['frameRate']);
  } else {
    frameDur = 1.0 / 60.0; // Valor predeterminado si no se puede medir la tasa
  }

  // Añadir información desde la URL
  util.addInfoFromUrl(expInfo);

  // Configuración del nombre del archivo de datos
  psychoJS.experiment.dataFileName = (("." + "/") + `data/${expInfo["Escribe tu correo electrónico, por favor"]}_${expName}_${expInfo["date"]}`);
  return Scheduler.Event.NEXT;
}

// Función para finalizar el experimento y enviar resultados
function sendExperimentResults() {
  let data = psychoJS.experiment._trialsData;

  let plainTextContent = `PARTICIPANTE (correo): ${expInfo['Escribe tu correo electrónico, por favor']}\n\n`;
  plainTextContent += `Test del Trazo - Tiempos fase A y B:\n\n`;

  data.forEach(row => {
    if (row.Condition !== undefined) {
      let diferencia = (row['trial.stopped'] - row['trial.started']).toFixed(3);
      if (row.Condition === 'Sample A') {
        plainTextContent += `A sencilla: ${diferencia} seg.\n`;
      } else if (row.Condition === 'A') {
        plainTextContent += `A compleja: ${diferencia} seg.\n`;
      } else if (row.Condition === 'Sample B') {
        plainTextContent += `B sencilla: ${diferencia} seg.\n`;
      } else if (row.Condition === 'B') {
        plainTextContent += `B compleja: ${diferencia} seg.\n`;
      }
    }
  });

  plainTextContent += `\nSaludos`;

  let emailData = {
    from_name: 'Tu Nombre',
    to_name: 'investigacionmovil.uned@gmail.com',
    subject: `TMT (1 Semana) - Correo: ${expInfo['Escribe tu correo electrónico, por favor']}`,
    message: plainTextContent,
    email: expInfo['Escribe tu correo electrónico, por favor']
  };

  emailjs.send(emailjsConfig.serviceID, emailjsConfig.templateID, emailData)
    .then(function(response) {
      console.log('Correo enviado con éxito:', response.status, response.text);
      alert('Correo enviado exitosamente!');
    })
    .catch(function(error) {
      console.error('Error al enviar el correo:', error);
      alert(`Error al enviar el correo: ${error.text}`);
    });
}

function endExperiment() {
  console.log('Experimento finalizado.');
  sendExperimentResults(); // Llamar para enviar los resultados del experimento
  psychoJS.experiment.save();
  psychoJS.quit({
    message: 'Gracias por tu paciencia. ¡Acabas de completar todas las pruebas!',
    isCompleted: true
  });
}












// Llamar a la función de finalización del experimento
flowScheduler.add(endExperiment);

// El resto de tu código, incluyendo las definiciones de las rutinas, sigue siendo el mismo.

// Asegúrate de que las credenciales de EmailJS están correctamente configuradas.

var setupClock;
var white;
var green;
var alphabet;
var fontColor;
var trialText;
var trialTargets;
var myClock;
var instrClock;
var instrText;
var mouse;
var clickHere;
var trialClock;
var trialMouse;
var trialCursor;
var thanksClock;
var thx_text;
var globalClock;
var routineTimer;
async function experimentInit() {
  // Initialize components for Routine "setup"
  setupClock = new util.Clock();
  // Run 'Begin Experiment' code from JSCode
  document.documentElement.style.cursor = 'auto';
  white = new util.Color([.9, .9, .9]);
  green = new util.Color([(-.5), .5, (-.5)]);
  // Run 'Begin Experiment' code from setupCode
  alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  fontColor = [0.9, 0.9, 0.9];
  trialText = [];
  trialTargets = [];
    for (var Idx = 0; Idx < 25; Idx++) {
      trialText.push(new visual.TextStim({
          win: psychoJS.window,
          name: "trialText" + Idx.toString(),
          text: " ",
          font: "Arial",
          pos: [0, -0.4],
          height: 0.06,
          wrapWidth: null,
          ori: 0,
          color: white
      }));
      trialTargets.push(new visual.Polygon({
          win: psychoJS.window,
          name: "target",
          fillColor: white,
          lineColor: white,
          edges: 36,
          pos: [0, -0.4],
          opacity: 0.25,
          size: 0.1
      }));
    } 
//  for (var Idx, _pj_c = 0, _pj_a = util.range(25), _pj_b = _pj_a.length; (_pj_c < _pj_b); _pj_c += 1) {
//      Idx = _pj_a[_pj_c];
//      trialText.push(new visual.TextStim({"win": psychoJS.window, "name": ("trialText" + Idx.toString()), "text": " ", "font": "Arial", "pos": [0, 0], "height": 0.06, "wrapWidth": null, "ori": 0, "color": white}));
//     trialTargets.push(new visual.Polygon({"win": psychoJS.window, "name": "target", "fillColor": white, "lineColor": white, "edges": 36, "pos": [0, 0], "opacity": 0.25, "size": 0.1}));
// }
  myClock = new util.Clock();
  
  // Initialize components for Routine "instr"
  instrClock = new util.Clock();
  instrText = new visual.TextStim({
    win: psychoJS.window,
    name: 'instrText',
    text: '',
    font: 'Arial',
    units: 'height', 
    pos: [0, 0.3], draggable: false, height: 0.05,  wrapWidth: undefined, ori: 0,
    languageStyle: 'LTR',
    color: new util.Color(fontColor),  opacity: 1,
    depth: -1.0 
  });
  
  mouse = new core.Mouse({
    win: psychoJS.window,
  });
  mouse.mouseClock = new util.Clock();
  clickHere = new visual.Polygon({
    win: psychoJS.window, name: 'clickHere', 
    edges: 100, size:[0.1, 0.1],
    ori: 0.0, 
    pos: [0, -0.3], 
    draggable: false, 
    anchor: 'center', 
    lineWidth: 1.0, 
    lineColor: new util.Color('lightgreen'), 
    fillColor: new util.Color('lightgreen'), 
    colorSpace: 'rgb', 
    opacity: undefined, 
    depth: -3, 
    interpolate: true, 
  });
  
  // Initialize components for Routine "trial"
  trialClock = new util.Clock();
  trialMouse = new core.Mouse({
    win: psychoJS.window,
  });
  trialMouse.mouseClock = new util.Clock();
  trialCursor = new visual.Polygon ({
    win: psychoJS.window, name: 'trialCursor', 
    edges: 180, size:[0.025, 0.025],
    ori: 0, 
    pos: [0, -0.3], 
    draggable: false, 
    anchor: 'center', 
    lineWidth: 1, 
    lineColor: new util.Color([1, 1, 1]), 
    fillColor: new util.Color([1, 1, 1]), 
    colorSpace: 'rgb', 
    opacity: 1, 
    depth: -2, 
    interpolate: true, 
  });
  
  // Initialize components for Routine "thanks"
  thanksClock = new util.Clock();
  thx_text = new visual.TextStim({
    win: psychoJS.window,
    name: 'thx_text',
    text: 'Fin',
    font: 'Arial',
    units: 'height', 
    pos: [0, -0.3], draggable: false, height: 0.05,  wrapWidth: undefined, ori: 0.0,
    languageStyle: 'LTR',
    color: new util.Color(fontColor),  opacity: undefined,
    depth: 0.0 
  });
  
  // Create some handy timers
  globalClock = new util.Clock();  // to track the time since experiment started
  routineTimer = new util.CountdownTimer();  // to track time remaining of each (non-slip) routine
  
  return Scheduler.Event.NEXT;
}


var t;
var frameN;
var continueRoutine;
var setupMaxDurationReached;
var setupMaxDuration;
var setupComponents;
function setupRoutineBegin(snapshot) {
  return async function () {
    TrialHandler.fromSnapshot(snapshot); // ensure that .thisN vals are up to date
    
    //--- Prepare to start Routine 'setup' ---
    t = 0;
    frameN = -1;
    continueRoutine = true; // until we're told otherwise
    setupClock.reset();
    routineTimer.reset();
    setupMaxDurationReached = false;
    // update component parameters for each repeat
    psychoJS.experiment.addData('setup.started', globalClock.getTime());
    setupMaxDuration = null
    // keep track of which components have finished
    setupComponents = [];
    
    for (const thisComponent of setupComponents)
      if ('status' in thisComponent)
        thisComponent.status = PsychoJS.Status.NOT_STARTED;
    return Scheduler.Event.NEXT;
  }
}


function setupRoutineEachFrame() {
  return async function () {
    //--- Loop for each frame of Routine 'setup' ---
    // get current time
    t = setupClock.getTime();
    frameN = frameN + 1;// number of completed frames (so 0 is the first frame)
    // update/draw components on each frame
    // check for quit (typically the Esc key)
    if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
      return quitPsychoJS('The [Escape] key was pressed. Adios!', false);
    }
    
    // check if the Routine should terminate
    if (!continueRoutine) {  // a component has requested a forced-end of Routine
      return Scheduler.Event.NEXT;
    }
    
    continueRoutine = false;  // reverts to True if at least one component still running
    for (const thisComponent of setupComponents)
      if ('status' in thisComponent && thisComponent.status !== PsychoJS.Status.FINISHED) {
        continueRoutine = true;
        break;
      }
    
    // refresh the screen if continuing
    if (continueRoutine) {
      return Scheduler.Event.FLIP_REPEAT;
    } else {
      return Scheduler.Event.NEXT;
    }
  };
}








function setupRoutineEnd(snapshot) {
  return async function () {
    //--- Ending Routine 'setup' ---
    for (const thisComponent of setupComponents) {
      if (typeof thisComponent.setAutoDraw === 'function') {
        thisComponent.setAutoDraw(false);
      }
    }
    psychoJS.experiment.addData('setup.stopped', globalClock.getTime());
    // the Routine "setup" was not non-slip safe, so reset the non-slip timer
    routineTimer.reset();
    
    // Routines running outside a loop should always advance the datafile row
    if (currentLoop === psychoJS.experiment) {
      psychoJS.experiment.nextEntry(snapshot);
    }
    return Scheduler.Event.NEXT;
  }
}


var trials;
function trialsLoopBegin(trialsLoopScheduler, snapshot) {
  return async function() {
    TrialHandler.fromSnapshot(snapshot); // update internal variables (.thisN etc) of the loop
    
    // set up handler to look after randomisation of conditions etc
    trials = new TrialHandler({
      psychoJS: psychoJS,
      nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
      extraInfo: expInfo, originPath: undefined,
      trialList: 'conditions.xlsx',
      seed: undefined, name: 'trials'
    });
    psychoJS.experiment.addLoop(trials); // add the loop to the experiment
    currentLoop = trials;  // we're now the current loop
    
    // Schedule all the trials in the trialList:
    for (const thisTrial of trials) {
      snapshot = trials.getSnapshot();
      trialsLoopScheduler.add(importConditions(snapshot));
      trialsLoopScheduler.add(instrRoutineBegin(snapshot));
      trialsLoopScheduler.add(instrRoutineEachFrame());
      trialsLoopScheduler.add(instrRoutineEnd(snapshot));
      trialsLoopScheduler.add(trialRoutineBegin(snapshot));
      trialsLoopScheduler.add(trialRoutineEachFrame());
      trialsLoopScheduler.add(trialRoutineEnd(snapshot));
      trialsLoopScheduler.add(trialsLoopEndIteration(trialsLoopScheduler, snapshot));
    }
    
    return Scheduler.Event.NEXT;
  }
}


async function trialsLoopEnd() {
  // terminate loop
  psychoJS.experiment.removeLoop(trials);
  // update the current loop from the ExperimentHandler
  if (psychoJS.experiment._unfinishedLoops.length>0)
    currentLoop = psychoJS.experiment._unfinishedLoops.at(-1);
  else
    currentLoop = psychoJS.experiment;  // so we use addData from the experiment
  return Scheduler.Event.NEXT;
}


function trialsLoopEndIteration(scheduler, snapshot) {
  // ------Prepare for next entry------
  return async function () {
    if (typeof snapshot !== 'undefined') {
      // ------Check if user ended loop early------
      if (snapshot.finished) {
        // Check for and save orphaned data
        if (psychoJS.experiment.isEntryEmpty()) {
          psychoJS.experiment.nextEntry(snapshot);
        }
        scheduler.stop();
      } else {
        psychoJS.experiment.nextEntry(snapshot);
      }
    return Scheduler.Event.NEXT;
    }
  };
}


var instrMaxDurationReached;
var msg;
var targetList;
var gotValidClick;
var instrMaxDuration;
var instrComponents;
function instrRoutineBegin(snapshot) {
  return async function () {
    TrialHandler.fromSnapshot(snapshot); // ensure that .thisN vals are up to date
    
    //--- Prepare to start Routine 'instr' ---
    t = 0;
    frameN = -1;
    continueRoutine = true; // until we're told otherwise
    instrClock.reset();
    routineTimer.reset();
    instrMaxDurationReached = false;
    // update component parameters for each repeat
    // Run 'Begin Routine' code from code_instr
    msg = "";
    targetList = [];
    for (var Idx, _pj_c = 0, _pj_a = util.range(Numbers), _pj_b = _pj_a.length; (_pj_c < _pj_b); _pj_c += 1) {
        Idx = _pj_a[_pj_c];
        msg += ((Idx + 1).toString() + ", ");
        targetList.push((Idx + 1).toString());
        if (Letters) {
            msg += (alphabet[Idx] + ", ");
            targetList.push(alphabet[Idx]);
        }
    }
    msg = msg.slice(0, (- 2));
    psychoJS.experiment.addData("Condition", Condition);
    
    //Actualizar las instrucciones
    instrText.setText(("\n\n\n\n\n\nINSTRUCCIONES:\n\n1. Usa tu ratón para trazar una línea que conecte los círculos en el orden correcto.\n2. Hazlo lo más rápido posible.\n3. Sigue este orden: " + msg + ".\n\n\n\n Para empezar haz click en este círculo."));    // setup some python lists for storing info about the mouse
    // setup some python lists for storing info about the mouse
    mouse.clicked_name = [];
    gotValidClick = false; // until a click is received
    mouse.mouseClock.reset();
    psychoJS.experiment.addData('instr.started', globalClock.getTime());
    instrMaxDuration = null
    // keep track of which components have finished
    instrComponents = [];
    instrComponents.push(instrText);
    instrComponents.push(mouse);
    instrComponents.push(clickHere);
    
    for (const thisComponent of instrComponents)
      if ('status' in thisComponent)
        thisComponent.status = PsychoJS.Status.NOT_STARTED;
    return Scheduler.Event.NEXT;
  }
}










var prevButtonState;
var _mouseButtons;
function instrRoutineEachFrame() {
  return async function () {
    //--- Loop for each frame of Routine 'instr' ---
    // get current time
    t = instrClock.getTime();
    frameN = frameN + 1;// number of completed frames (so 0 is the first frame)
    // update/draw components on each frame
    // Run 'Each Frame' code from code_instr
    if (clickHere.contains(mouse) && mouse.getPressed()[0] === 1) {
        continueRoutine = false;
    }
    
    
    // *instrText* updates
    if (t >= 0.0 && instrText.status === PsychoJS.Status.NOT_STARTED) {
      // keep track of start time/frame for later
      instrText.tStart = t;  // (not accounting for frame time here)
      instrText.frameNStart = frameN;  // exact frame index
      
      instrText.setAutoDraw(true);
    }
    
    // *mouse* updates
    if (t >= 0.0 && mouse.status === PsychoJS.Status.NOT_STARTED) {
      // keep track of start time/frame for later
      mouse.tStart = t;  // (not accounting for frame time here)
      mouse.frameNStart = frameN;  // exact frame index
      
      mouse.status = PsychoJS.Status.STARTED;
      prevButtonState = mouse.getPressed();  // if button is down already this ISN'T a new click
      }
    if (mouse.status === PsychoJS.Status.STARTED) {  // only update if started and not finished!
      _mouseButtons = mouse.getPressed();
      if (!_mouseButtons.every( (e,i,) => (e == prevButtonState[i]) )) { // button state changed?
        prevButtonState = _mouseButtons;
        if (_mouseButtons.reduce( (e, acc) => (e+acc) ) > 0) { // state changed to a new click
          // check if the mouse was inside our 'clickable' objects
          gotValidClick = false;
          mouse.clickableObjects = eval(clickHere)
          ;// make sure the mouse's clickable objects are an array
          if (!Array.isArray(mouse.clickableObjects)) {
              mouse.clickableObjects = [mouse.clickableObjects];
          }
          // iterate through clickable objects and check each
          for (const obj of mouse.clickableObjects) {
              if (obj.contains(mouse)) {
                  gotValidClick = true;
                  mouse.clicked_name.push(obj.name);
              }
          }
          // check if the mouse was inside our 'clickable' objects
          gotValidClick = false;
          mouse.clickableObjects = eval(clickHere)
          ;// make sure the mouse's clickable objects are an array
          if (!Array.isArray(mouse.clickableObjects)) {
              mouse.clickableObjects = [mouse.clickableObjects];
          }
          // iterate through clickable objects and check each
          for (const obj of mouse.clickableObjects) {
              if (obj.contains(mouse)) {
                  gotValidClick = true;
                  mouse.clicked_name.push(obj.name);
              }
          }
          if (gotValidClick === true) { // end routine on response
            continueRoutine = false;
          }
        }
      }
    }
    
    // *clickHere* updates
    if (t >= 0.0 && clickHere.status === PsychoJS.Status.NOT_STARTED) {
      // keep track of start time/frame for later
      clickHere.tStart = t;  // (not accounting for frame time here)
      clickHere.frameNStart = frameN;  // exact frame index
      
      clickHere.setAutoDraw(true);
    }
    
    // check for quit (typically the Esc key)
    if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
      return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
    }
    
    // check if the Routine should terminate
    if (!continueRoutine) {  // a component has requested a forced-end of Routine
      return Scheduler.Event.NEXT;
    }
    
    continueRoutine = false;  // reverts to True if at least one component still running
    for (const thisComponent of instrComponents)
      if ('status' in thisComponent && thisComponent.status !== PsychoJS.Status.FINISHED) {
        continueRoutine = true;
        break;
      }
    
    // refresh the screen if continuing
    if (continueRoutine) {
      return Scheduler.Event.FLIP_REPEAT;
    } else {
      return Scheduler.Event.NEXT;
    }
  };
}











function instrRoutineEnd(snapshot) {
  return async function () {
    //--- Ending Routine 'instr' ---
    for (const thisComponent of instrComponents) {
      if (typeof thisComponent.setAutoDraw === 'function') {
        thisComponent.setAutoDraw(false);
      }
    }
    psychoJS.experiment.addData('instr.stopped', globalClock.getTime());
    // store data for psychoJS.experiment (ExperimentHandler)
    // the Routine "instr" was not non-slip safe, so reset the non-slip timer
    routineTimer.reset();
    
    // Routines running outside a loop should always advance the datafile row
    if (currentLoop === psychoJS.experiment) {
      psychoJS.experiment.nextEntry(snapshot);
    }
    return Scheduler.Event.NEXT;
  }
}

var trialMaxDurationReached;
var trialStep;
var shapeList;
var trialMaxDuration;
var trialComponents;
function trialRoutineBegin(snapshot) {
  return async function () {
    TrialHandler.fromSnapshot(snapshot); // ensure that .thisN vals are up to date
    
    //--- Prepare to start Routine 'trial' ---
    t = 0;
    frameN = -1;
    continueRoutine = true; // until we're told otherwise
    trialClock.reset();
    routineTimer.reset();
    trialMaxDurationReached = false;
    // update component parameters for each repeat
    // Run 'Begin Routine' code from trialCode
    trialCursor.pos = [0, 0];
    console.log("len(targetList)", targetList.length);
    // Inicializar trialTargets y trialText
    //for (var Idx, _pj_c = 0, _pj_a = util.range(targetList.length), _pj_b = _pj_a.length; (_pj_c < _pj_b); _pj_c += 1) {
    //      Idx = _pj_a[_pj_c];
    for (var Idx = 0; Idx < targetList.length; Idx++) {
        trialTargets[Idx].setPos([((posArray1[Idx] / 1000) - 0.5), (0.5 - (posArray2[Idx] / 1000))]);
        trialTargets[Idx].setAutoDraw(true);
        trialText[Idx].setPos([((posArray1[Idx] / 1000) - 0.5), (0.5 - (posArray2[Idx] / 1000))]);
        trialText[Idx].text = targetList[Idx];
        trialText[Idx].setColor(white);
        trialText[Idx].setAutoDraw(true);
    }
    trialStep = 0;
    shapeList = [];
    
    // setup some python lists for storing info about the trialMouse
    gotValidClick = false; // until a click is received
    trialMouse.mouseClock.reset();
    psychoJS.experiment.addData('trial.started', globalClock.getTime());
    trialMaxDuration = null
    // keep track of which components have finished
    trialComponents = [];
    trialComponents.push(trialMouse);
    trialComponents.push(trialCursor);
    
    for (const thisComponent of trialComponents)
      if ('status' in thisComponent)
        thisComponent.status = PsychoJS.Status.NOT_STARTED;
    return Scheduler.Event.NEXT;
  }
}

var CursorTargetDistance;
function trialRoutineEachFrame() {
  return async function () {
    //--- Loop for each frame of Routine 'trial' ---
    // get current time
    t = trialClock.getTime();
    frameN = frameN + 1;// number of completed frames (so 0 is the first frame)
    // update/draw components on each frame
    // Run 'Each Frame' code from trialCode
    if ((myClock.getTime() > 600)) {
        continueRoutine = false;
        trials.finished = true;
    }
    CursorTargetDistance = Math.sqrt((Math.pow((trialCursor.pos[0] - trialTargets[trialStep].pos[0]), 2) + Math.pow((trialCursor.pos[1] - trialTargets[trialStep].pos[1]), 2)));
       if ((CursorTargetDistance < 0.05)) {
        trialText[trialStep].setColor(green);
        if ((trialStep > 0)) {
            shapeList.push(new visual.ShapeStim({"win": psychoJS.window, "name": ("line" + trialStep.toString()), "lineColor": white, "lineWidth": 2, "vertices": [[((posArray1[(trialStep - 1)] / 1000) - 0.5), (0.5 - (posArray2[(trialStep - 1)] / 1000))], [((posArray1[trialStep] / 1000) - 0.5), (0.5 - (posArray2[trialStep] / 1000))]]}));
            //shapeList.slice((- 1))[0].setAutoDraw(true);
            shapeList[shapeList.length - 1].setAutoDraw(true);
        }
        psychoJS.experiment.addData("RTstep" + trialStep.toString(), Math.round(t * 1000));
        // psychoJS.experiment.addData(("RTstep" + trialStep.toString()), util.round((t * 1000)));
        trialStep += 1;
        if ((trialStep === targetList.length)) {
            continueRoutine = false;
            psychoJS.experiment.addData("Score", Math.round(t));
            // psychoJS.experiment.addData("Score", util.round(t));
        }
    }
    
    
    if (trialCursor.status === PsychoJS.Status.STARTED){ // only update if being drawn
      trialCursor.setPos([trialMouse.getPos()[0], trialMouse.getPos()[1]], false);
    }
    
    // *trialCursor* updates
    if (t >= 0.0 && trialCursor.status === PsychoJS.Status.NOT_STARTED) {
      // keep track of start time/frame for later
      trialCursor.tStart = t;  // (not accounting for frame time here)
      trialCursor.frameNStart = frameN;  // exact frame index
      
      trialCursor.setAutoDraw(true);
    }
    
    // check for quit (typically the Esc key)
    if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
      return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
    }
    
    // check if the Routine should terminate
    if (!continueRoutine) {  // a component has requested a forced-end of Routine
      return Scheduler.Event.NEXT;
    }
    
    continueRoutine = false;  // reverts to True if at least one component still running
    for (const thisComponent of trialComponents)
      if ('status' in thisComponent && thisComponent.status !== PsychoJS.Status.FINISHED) {
        continueRoutine = true;
        break;
      }
    
    // refresh the screen if continuing
    if (continueRoutine) {
      return Scheduler.Event.FLIP_REPEAT;
    } else {
      return Scheduler.Event.NEXT;
    }
  };
}

var _mouseXYs;
function trialRoutineEnd(snapshot) {
  return async function () {
    //--- Ending Routine 'trial' ---
    for (const thisComponent of trialComponents) {
      if (typeof thisComponent.setAutoDraw === 'function') {
        thisComponent.setAutoDraw(false);
      }
    }
    psychoJS.experiment.addData('trial.stopped', globalClock.getTime());
    // Run 'End Routine' code from trialCode
    for (var Idx, _pj_c = 0, _pj_a = util.range(targetList.length), _pj_b = _pj_a.length; (_pj_c < _pj_b); _pj_c += 1) {
        Idx = _pj_a[_pj_c];
        trialTargets[Idx].setAutoDraw(false);
        trialText[Idx].setAutoDraw(false);
    }
    for (var Idx, _pj_c = 0, _pj_a = util.range(shapeList.length), _pj_b = _pj_a.length; (_pj_c < _pj_b); _pj_c += 1) {
        Idx = _pj_a[_pj_c];
        shapeList[Idx].setAutoDraw(false);
    }
    
    // store data for psychoJS.experiment (ExperimentHandler)
    _mouseXYs = trialMouse.getPos();
    _mouseButtons = trialMouse.getPressed();
    psychoJS.experiment.addData('trialMouse.x', _mouseXYs[0]);
    psychoJS.experiment.addData('trialMouse.y', _mouseXYs[1]);
    psychoJS.experiment.addData('trialMouse.leftButton', _mouseButtons[0]);
    psychoJS.experiment.addData('trialMouse.midButton', _mouseButtons[1]);
    psychoJS.experiment.addData('trialMouse.rightButton', _mouseButtons[2]);
    // the Routine "trial" was not non-slip safe, so reset the non-slip timer
    routineTimer.reset();
    
    // Routines running outside a loop should always advance the datafile row
    if (currentLoop === psychoJS.experiment) {
      psychoJS.experiment.nextEntry(snapshot);
    }
    return Scheduler.Event.NEXT;
  }
}

var thanksMaxDurationReached;
var thanksMaxDuration;
var thanksComponents;
function thanksRoutineBegin(snapshot) {
  return async function () {
    TrialHandler.fromSnapshot(snapshot); // ensure that .thisN vals are up to date
    
    //--- Prepare to start Routine 'thanks' ---
    t = 0;
    frameN = -1;
    continueRoutine = true; // until we're told otherwise
    thanksClock.reset(routineTimer.getTime());
    routineTimer.add(2.000000);
    thanksMaxDurationReached = false;
    // update component parameters for each repeat
    psychoJS.experiment.addData('thanks.started', globalClock.getTime());
    thanksMaxDuration = null
    // keep track of which components have finished
    thanksComponents = [];
    thanksComponents.push(thx_text);
    
    for (const thisComponent of thanksComponents)
      if ('status' in thisComponent)
        thisComponent.status = PsychoJS.Status.NOT_STARTED;
    return Scheduler.Event.NEXT;
  }
}











var frameRemains;
function thanksRoutineEachFrame() {
  return async function () {
    //--- Loop for each frame of Routine 'thanks' ---
    // get current time
    t = thanksClock.getTime();
    frameN = frameN + 1;// number of completed frames (so 0 is the first frame)
    // update/draw components on each frame
    
    // *thx_text* updates
    if (t >= 0.0 && thx_text.status === PsychoJS.Status.NOT_STARTED) {
      // keep track of start time/frame for later
      thx_text.tStart = t;  // (not accounting for frame time here)
      thx_text.frameNStart = frameN;  // exact frame index
      
      thx_text.setAutoDraw(true);
    }
    
    frameRemains = 0.0 + 2 - psychoJS.window.monitorFramePeriod * 0.75;// most of one frame period left
    if (thx_text.status === PsychoJS.Status.STARTED && t >= frameRemains) {
      thx_text.setAutoDraw(false);
    }
    
    // check for quit (typically the Esc key)
    if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
      return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
    }
    
    // check if the Routine should terminate
    if (!continueRoutine) {  // a component has requested a forced-end of Routine
      return Scheduler.Event.NEXT;
    }
    
    continueRoutine = false;  // reverts to True if at least one component still running
    for (const thisComponent of thanksComponents)
      if ('status' in thisComponent && thisComponent.status !== PsychoJS.Status.FINISHED) {
        continueRoutine = true;
        break;
      }
    
    // refresh the screen if continuing
    if (continueRoutine && routineTimer.getTime() > 0) {
      return Scheduler.Event.FLIP_REPEAT;
    } else {
      return Scheduler.Event.NEXT;
    }
  };
}

function thanksRoutineEnd(snapshot) {
  return async function () {
    //--- Ending Routine 'thanks' ---
    for (const thisComponent of thanksComponents) {
      if (typeof thisComponent.setAutoDraw === 'function') {
        thisComponent.setAutoDraw(false);
      }
    }
    psychoJS.experiment.addData('thanks.stopped', globalClock.getTime());
    if (thanksMaxDurationReached) {
        thanksClock.add(thanksMaxDuration);
    } else {
        thanksClock.add(2.000000);
    }
    // Routines running outside a loop should always advance the datafile row
    if (currentLoop === psychoJS.experiment) {
      psychoJS.experiment.nextEntry(snapshot);
    }
    return Scheduler.Event.NEXT;
  }
}

function importConditions(currentLoop) {
  return async function () {
    psychoJS.importAttributes(currentLoop.getCurrentTrial());
    return Scheduler.Event.NEXT;
    };
}


async function quitPsychoJS(message, isCompleted) {
  // Verificar y guardar datos pendientes
  if (psychoJS.experiment.isEntryEmpty()) {
    psychoJS.experiment.nextEntry();
  }

  // Restaurar el cursor por defecto
  document.documentElement.style.cursor = 'auto';

  // Cerrar la ventana de PsychoJS
  psychoJS.window.close();

  // Finalizar el experimento y guardar los datos
  await psychoJS.quit({
    message: message,
    isCompleted: isCompleted
  });

  return Scheduler.Event.QUIT;
}

