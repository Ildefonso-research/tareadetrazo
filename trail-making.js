/********************* 
 * Test-de-Trazo *
 *********************/

import { core, data, sound, util, visual, hardware } from './lib/psychojs-2024.2.4.js';
const { PsychoJS } = core;
const { TrialHandler, MultiStairHandler } = data;
const { Scheduler } = util;
// some handy aliases as in the psychopy scripts;
const { abs, sin, cos, PI: pi, sqrt } = Math;
const { round } = util;

// Cambiar el nombre del experimento y los campos de entrada
let expName = 'TEST DE TRAZO'; // Nombre del experimento
let expInfo = {
    'Escribe tu teléfono, por favor': 'xxxxxxxxx' // Valor predeterminado
};

// Variables globales para errores
let errorCountSampleA = 0;
let errorCountA = 0;
let errorCountSampleB = 0;
let errorCountB = 0;

// Variable global para sonido de error
var errorSound;

// Activar el servidor
fetch('https://tareadetrazo.onrender.com/get-email-config')
  .then(response => {
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
    }
    return response.json();
  })
  .then(config => {
    emailjsConfig = config;
    console.log('Configuración de EmailJS cargada:', emailjsConfig);
    emailjs.init(emailjsConfig.userID);
  })
  .catch(error => {
    console.error('Error al cargar la configuración de EmailJS:', error);
    alert('No se pudo cargar la configuración del servidor. Por favor, intenta más tarde.');
  });


// Obtener las claves sensibles desde el servidor
let emailjsConfig = {};
fetch('https://tareadetrazo.onrender.com/get-email-config')
  .then(response => {
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
    }
    return response.json();
  })
  .then(config => {
    emailjsConfig = config;
    console.log('Configuración de EmailJS cargada:', emailjsConfig);
    emailjs.init(emailjsConfig.userID); // Inicializar EmailJS con el userID proporcionado
  })
  .catch(error => {
    console.error('Error al cargar la configuración de EmailJS:', error);
    alert('No se pudo cargar la configuración del servidor. Por favor, intenta más tarde.');
  });

// Inicializar PsychoJS
const psychoJS = new PsychoJS({
  debug: true
});

// Abrir la ventana:
psychoJS.openWindow({
  fullscr: true,
  color: new util.Color([(- 0.67), (- 0.67), (- 0.67)]),
  units: 'height',
  waitBlanking: true,
  backgroundImage: '',
  backgroundFit: 'none',
});


// Función para manejar errores
function handleError() {
  // Reproducir sonido de error
  errorSound.play();

  // Contabilizar errores según la etapa actual
  switch (currentStage) {
    case 1:
      errorCountSampleA += 1;
      break;
    case 2:
      errorCountA += 1;
      break;
    case 3:
      errorCountSampleB += 1;
      break;
    case 4:
      errorCountB += 1;
      break;
  }

  // Mensaje de depuración en la consola
  console.log(`Error registrado en la etapa ${currentStage}`);
}

// Programar el experimento:
psychoJS.schedule(psychoJS.gui.DlgFromDict({
  dictionary: expInfo,
  title: expName
}));

const flowScheduler = new Scheduler(psychoJS);
const dialogCancelScheduler = new Scheduler(psychoJS);
psychoJS.scheduleCondition(function() { return (psychoJS.gui.dialogComponent.button === 'OK'); }, flowScheduler, dialogCancelScheduler);

// flowScheduler se ejecuta si los participantes presionan OK
flowScheduler.add(updateInfo); // Añadir timeStamp
flowScheduler.add(experimentInit); // Llamar al inicio del experimento para configurar el sonido
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
flowScheduler.add(endExperiment); // Asegúrate de que esta línea está presente para llamar a endExperiment
flowScheduler.add(quitPsychoJS, '', true);

// Terminar si el usuario presiona Cancelar en el cuadro de diálogo:
dialogCancelScheduler.add(quitPsychoJS, '', false);

psychoJS.start({
  expName: expName,
  expInfo: expInfo,
  resources: [
    // resources:
    {'name': 'conditions.xlsx', 'path': 'conditions.xlsx'},
    {'name': 'error.wav', 'path': 'error.wav'} // Asegúrate de incluir el archivo de sonido como recurso
  ]
});

psychoJS.experimentLogger.setLevel(core.Logger.ServerLevel.EXP);

var currentLoop;
var frameDur;
async function updateInfo() {
  currentLoop = psychoJS.experiment;  // right now there are no loops
  expInfo['date'] = util.MonotonicClock.getDateStr();  // añadir un simple timestamp
  expInfo['expName'] = expName;
  expInfo['psychopyVersion'] = '2024.2.4';
  expInfo['OS'] = window.navigator.platform;

  // Almacenar la tasa de fotogramas del monitor si podemos medirla con éxito
  expInfo['frameRate'] = psychoJS.window.getActualFrameRate();
  if (typeof expInfo['frameRate'] !== 'undefined')
    frameDur = 1.0 / Math.round(expInfo['frameRate']);
  else
    frameDur = 1.0 / 60.0; // no pudimos obtener una medida confiable, así que adivinamos

  // Añadir información desde la URL:
  util.addInfoFromUrl(expInfo);

  psychoJS.experiment.dataFileName = (("." + "/") + `data/${expInfo["participant"]}_${expName}_${expInfo["date"]}`);
  psychoJS.experiment.field_separator = '\t';

  return Scheduler.Event.NEXT;
}


// Función para enviar los resultados del experimento por correo usando EmailJS
function sendExperimentResults() {
  let data = psychoJS.experiment._trialsData;

  let plainTextContent = `PARTICIPANTE (teléfono): ${expInfo['Escribe tu teléfono, por favor']}\n\n`;
  plainTextContent += `Test del Trazo - Tiempos fase A y B:\n\n`;

  // Procesar los datos de cada fase y añadir errores
  data.forEach(row => {
    if (row.Condition !== undefined) {
      let diferencia = (row['trial.stopped'] - row['trial.started']).toFixed(3);
      if (row.Condition === 'Sample A') {
        plainTextContent += `A sencilla: ${diferencia} seg.   errores: ${errorCountSampleA}\n`;
      } else if (row.Condition === 'A') {
        plainTextContent += `A compleja: ${diferencia} seg.   errores: ${errorCountA}\n`;
      } else if (row.Condition === 'Sample B') {
        plainTextContent += `B sencilla: ${diferencia} seg.   errores: ${errorCountSampleB}\n`;
      } else if (row.Condition === 'B') {
        plainTextContent += `B compleja: ${diferencia} seg.   errores: ${errorCountB}\n`;
      }
    }
  });

  plainTextContent += `\nSaludos`;

  let emailData = {
    from_name: 'Tu Nombre',
    to_name: 'investigacionmovil.uned@gmail.com',
    subject: `TMT (1 Semana) - Teléfono: ${expInfo['Escribe tu teléfono, por favor']}`,
    message: plainTextContent,
    phone: expInfo['Escribe tu teléfono, por favor']
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

// Función para finalizar el experimento
function endExperiment() {
  console.log('Experimento finalizado.');

  // Guardar los errores por etapa
  psychoJS.experiment.addData('ErroresSampleA', errorCountSampleA);
  psychoJS.experiment.addData('ErroresA', errorCountA);
  psychoJS.experiment.addData('ErroresSampleB', errorCountSampleB);
  psychoJS.experiment.addData('ErroresB', errorCountB);

  sendExperimentResults(); // Llamar a la función para enviar los resultados del experimento
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
  // Inicializar el sonido de error
  errorSound = new sound.Sound({
    win: psychoJS.window,
    value: 'error.wav', // Ruta al archivo de sonido
    secs: 1.0 // Duración del sonido
  });

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
  
  // Definir los objetivos visuales y sus posiciones
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
  
  myClock = new util.Clock();
  
  // Initialize components for Routine "instr"
  instrClock = new util.Clock();
  instrText = new visual.TextStim({
    win: psychoJS.window,
    name: 'instrText',
    text: '',
    font: 'Arial',
    units: undefined, 
    pos: [0, 0.3], draggable: false, height: 0.05, wrapWidth: undefined, ori: 0,
    languageStyle: 'LTR',
    color: new util.Color(fontColor), opacity: 1,
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
    units: undefined, 
    pos: [0, -0.3], draggable: false, height: 0.05, wrapWidth: undefined, ori: 0.0,
    languageStyle: 'LTR',
    color: new util.Color(fontColor), opacity: undefined,
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
    setupMaxDuration = null;
    // keep track of which components have finished
    setupComponents = [];
    
    for (const thisComponent of setupComponents)
      if ('status' in thisComponent)
        thisComponent.status = PsychoJS.Status.NOT_STARTED;
    return Scheduler.Event.NEXT;
  };
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
  };
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
      trialList: 'conditions.xlsx', // Importar datos del archivo
      seed: undefined, name: 'trials'
    });
    psychoJS.experiment.addLoop(trials); // add the loop to the experiment
    currentLoop = trials;  // we're now the current loop
    
    // Schedule all the trials in the trialList:
    for (const thisTrial of trials) {
      snapshot = trials.getSnapshot();
      trialsLoopScheduler.add(importConditions(snapshot)); // Importar las condiciones de cada fase
      trialsLoopScheduler.add(instrRoutineBegin(snapshot));
      trialsLoopScheduler.add(instrRoutineEachFrame());
      trialsLoopScheduler.add(instrRoutineEnd(snapshot));
      trialsLoopScheduler.add(trialRoutineBegin(snapshot));
      trialsLoopScheduler.add(trialRoutineEachFrame()); // Actualización clave aquí
      trialsLoopScheduler.add(trialRoutineEnd(snapshot));
      trialsLoopScheduler.add(trialsLoopEndIteration(trialsLoopScheduler, snapshot));
    }
    
    return Scheduler.Event.NEXT;
  };
}

async function trialsLoopEnd() {
  // terminate loop
  psychoJS.experiment.removeLoop(trials);
  // update the current loop from the ExperimentHandler
  if (psychoJS.experiment._unfinishedLoops.length > 0)
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
    }
    return Scheduler.Event.NEXT;
  };
}

var instrMaxDurationReached;
var msg;
var targetList;
var gotValidHover;
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

    // Preparar la instrucción para la fase actual
    msg = "";
    targetList = [];
    for (var Idx, _pj_c = 0, _pj_a = util.range(Numbers), _pj_b = _pj_a.length; (_pj_c < _pj_b); _pj_c += 1) {
        Idx = _pj_a[_pj_c];
        msg += ((Idx + 1).toString() + ", ");
        targetList.push((Idx + 1).toString());
        if (Letters) { // Si hay letras, añadirlas también
            msg += (alphabet[Idx] + ", ");
            targetList.push(alphabet[Idx]);
        }
    }
    msg = msg.slice(0, (- 2)); // Eliminar la última coma
    psychoJS.experiment.addData("Condition", Condition); // Registrar la condición actual
    
    // Actualizar las instrucciones para el usuario
    instrText.setText(("\n\n\n\n\n\nINSTRUCCIONES:\n\n1. Usa tu ratón para trazar una línea que conecte los círculos en el orden correcto.\n2. Hazlo lo más rápido posible.\n3. Sigue este orden: " + msg + ".\n\n\n\n Para comenzar, pasa el cursor por el primer círculo."));

    // Configurar detección de "hover" inicial
    gotValidHover = false; // Hasta que el ratón pase sobre el primer objetivo
    psychoJS.experiment.addData('instr.started', globalClock.getTime());
    instrMaxDuration = null;

    // Preparar los componentes de la rutina
    instrComponents = [];
    instrComponents.push(instrText);
    instrComponents.push(mouse);
    instrComponents.push(clickHere);
    
    for (const thisComponent of instrComponents)
      if ('status' in thisComponent)
        thisComponent.status = PsychoJS.Status.NOT_STARTED;

    return Scheduler.Event.NEXT;
  };
}

var prevButtonState;
function instrRoutineEachFrame() {
  return async function () {
    //--- Loop for each frame of Routine 'instr' ---
    // Obtener el tiempo actual
    t = instrClock.getTime();
    frameN = frameN + 1;

    // Detectar si el ratón pasa por encima del objetivo inicial
    if (clickHere.contains(mouse.getPos())) { // Si el cursor está sobre el objetivo
      gotValidHover = true;
      continueRoutine = false; // Continuar con el experimento
    }

    // *clickHere* updates
    if (t >= 0.0 && clickHere.status === PsychoJS.Status.NOT_STARTED) {
      clickHere.tStart = t;
      clickHere.frameNStart = frameN;
      clickHere.setAutoDraw(true);
    }

    // Comprobar si se presiona la tecla Esc para salir
    if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
      return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
    }

    // Actualizar visualización de texto de instrucciones
    if (t >= 0.0 && instrText.status === PsychoJS.Status.NOT_STARTED) {
      instrText.tStart = t; 
      instrText.frameNStart = frameN;
      instrText.setAutoDraw(true);
    }

    // Comprobar si la rutina debe terminar
    if (!continueRoutine) {  
      return Scheduler.Event.NEXT;
    }

    continueRoutine = false; // Mantener activo mientras haya componentes
    for (const thisComponent of instrComponents) {
      if ('status' in thisComponent && thisComponent.status !== PsychoJS.Status.FINISHED) {
        continueRoutine = true;
        break;
      }
    }

    // Refrescar pantalla si la rutina continúa
    if (continueRoutine) {
      return Scheduler.Event.FLIP_REPEAT;
    } else {
      return Scheduler.Event.NEXT;
    }
  };
}



function instrRoutineEnd(snapshot) {
  return async function () {
    // Finalizar la rutina de instrucciones
    for (const thisComponent of instrComponents) {
      if (typeof thisComponent.setAutoDraw === 'function') {
        thisComponent.setAutoDraw(false);
      }
    }
    psychoJS.experiment.addData('instr.stopped', globalClock.getTime());
    // La rutina no era completamente segura, por lo que restablecemos el temporizador no deslizante
    routineTimer.reset();

    // Rutinas que se ejecutan fuera de un bucle deben avanzar siempre la fila del archivo de datos
    if (currentLoop === psychoJS.experiment) {
      psychoJS.experiment.nextEntry(snapshot);
    }
    return Scheduler.Event.NEXT;
  };
}

var trialMaxDurationReached;
var trialStep;
var shapeList;
var trialMaxDuration;
var trialComponents;
function trialRoutineBegin(snapshot) {
  return async function () {
    TrialHandler.fromSnapshot(snapshot); // Actualizar valores de las variables internas
    
    //--- Preparar para iniciar la rutina 'trial' ---
    t = 0;
    frameN = -1;
    continueRoutine = true;
    trialClock.reset();
    routineTimer.reset();
    trialMaxDurationReached = false;

    // Inicializar el cursor y los objetivos
    trialCursor.pos = [0, 0];
    console.log("len(targetList)", targetList.length);

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

    // Preparar listas para almacenar datos del cursor
    gotValidClick = false;
    trialMouse.mouseClock.reset();
    psychoJS.experiment.addData('trial.started', globalClock.getTime());
    trialMaxDuration = null;

    // Preparar componentes de la rutina
    trialComponents = [];
    trialComponents.push(trialMouse);
    trialComponents.push(trialCursor);
    
    for (const thisComponent of trialComponents) {
      if ('status' in thisComponent)
        thisComponent.status = PsychoJS.Status.NOT_STARTED;
    }
    return Scheduler.Event.NEXT;
  };
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










var CursorTargetDistance;
function trialRoutineEachFrame() {
  return async function () {
    //--- Loop for each frame of Routine 'trial' ---
    // Obtener el tiempo actual
    t = trialClock.getTime();
    frameN = frameN + 1; // Número de frames completados (0 es el primero)

    // Verificar si el tiempo máximo permitido ha sido alcanzado (opcional)
    if ((myClock.getTime() > 600)) {
        continueRoutine = false;
        trials.finished = true;
    }

    // Calcular la distancia del cursor al objetivo esperado
    CursorTargetDistance = Math.sqrt(
      Math.pow((trialCursor.pos[0] - trialTargets[trialStep].pos[0]), 2) +
      Math.pow((trialCursor.pos[1] - trialTargets[trialStep].pos[1]), 2)
    );

    if (CursorTargetDistance < 0.05) { // Si el cursor está cerca del objetivo esperado
        // Validar si el objetivo alcanzado es el correcto
        if (trialTargets[trialStep].text === targetList[trialStep]) {
            trialText[trialStep].setColor(green); // Cambiar color del texto si es correcto
            if (trialStep > 0) {
                // Dibujar una línea entre el objetivo anterior y el actual
                shapeList.push(new visual.ShapeStim({
                    win: psychoJS.window,
                    name: ("line" + trialStep.toString()),
                    lineColor: white,
                    lineWidth: 2,
                    vertices: [
                        [((posArray1[trialStep - 1] / 1000) - 0.5), (0.5 - (posArray2[trialStep - 1] / 1000))],
                        [((posArray1[trialStep] / 1000) - 0.5), (0.5 - (posArray2[trialStep] / 1000))]
                    ]
                }));
                shapeList[shapeList.length - 1].setAutoDraw(true);
            }
            // Registrar el tiempo de reacción para este paso
            psychoJS.experiment.addData("RTstep" + trialStep.toString(), Math.round(t * 1000));
            trialStep += 1; // Avanzar al siguiente objetivo
        } else {
            // Si el objetivo alcanzado no es el correcto, manejar el error
            handleError(); // Reproducir el sonido y contar el error
        }

        // Si todos los objetivos han sido alcanzados en el orden correcto
        if (trialStep === targetList.length) {
            continueRoutine = false; // Terminar la rutina
            psychoJS.experiment.addData("Score", Math.round(t)); // Registrar el tiempo total
        }
    }

    // Actualizar la posición del cursor en la pantalla
    if (trialCursor.status === PsychoJS.Status.STARTED) {
      trialCursor.setPos([trialMouse.getPos()[0], trialMouse.getPos()[1]], false);
    }

    // Actualizar el estado del cursor
    if (t >= 0.0 && trialCursor.status === PsychoJS.Status.NOT_STARTED) {
      trialCursor.tStart = t; // Registrar tiempo de inicio
      trialCursor.frameNStart = frameN; // Frame exacto de inicio
      trialCursor.setAutoDraw(true);
    }

    // Comprobar si se presiona la tecla Esc para salir
    if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({keyList: ['escape']}).length > 0) {
      return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
    }

    // Comprobar si la rutina debe terminar
    if (!continueRoutine) {  
      return Scheduler.Event.NEXT;
    }

    continueRoutine = false; // Cambiar a true si al menos un componente sigue activo
    for (const thisComponent of trialComponents) {
      if ('status' in thisComponent && thisComponent.status !== PsychoJS.Status.FINISHED) {
        continueRoutine = true;
        break;
      }
    }

    // Refrescar pantalla si la rutina continúa
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
    // Finalizar la rutina 'trial'
    for (const thisComponent of trialComponents) {
      if (typeof thisComponent.setAutoDraw === 'function') {
        thisComponent.setAutoDraw(false);
      }
    }
    psychoJS.experiment.addData('trial.stopped', globalClock.getTime());
    
    // Apagar los objetivos y las líneas al final de la rutina
    for (var Idx = 0; Idx < targetList.length; Idx++) {
        trialTargets[Idx].setAutoDraw(false);
        trialText[Idx].setAutoDraw(false);
    }
    for (var Idx = 0; Idx < shapeList.length; Idx++) {
        shapeList[Idx].setAutoDraw(false);
    }

    // Registrar datos del ratón
    _mouseXYs = trialMouse.getPos();
    psychoJS.experiment.addData('trialMouse.x', _mouseXYs[0]);
    psychoJS.experiment.addData('trialMouse.y', _mouseXYs[1]);

    // Restablecer el temporizador
    routineTimer.reset();

    // Avanzar al siguiente ensayo o rutina
    if (currentLoop === psychoJS.experiment) {
      psychoJS.experiment.nextEntry(snapshot);
    }
    return Scheduler.Event.NEXT;
  };
}














var frameRemains;
function thanksRoutineEachFrame() {
  return async function () {
    //--- Loop for each frame of Routine 'thanks' ---
    // Obtener el tiempo actual
    t = thanksClock.getTime();
    frameN = frameN + 1; // Número de frames completados

    // *thx_text* updates
    if (t >= 0.0 && thx_text.status === PsychoJS.Status.NOT_STARTED) {
      thx_text.tStart = t; // Registrar tiempo de inicio
      thx_text.frameNStart = frameN; // Frame exacto de inicio
      
      thx_text.setAutoDraw(true); // Mostrar el texto de agradecimiento
    }
    
    frameRemains = 0.0 + 2 - psychoJS.window.monitorFramePeriod * 0.75; // Restante de un ciclo de frame
    if (thx_text.status === PsychoJS.Status.STARTED && t >= frameRemains) {
      thx_text.setAutoDraw(false); // Apagar el texto de agradecimiento
    }
    
    // Comprobar si se presiona la tecla Esc para salir
    if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
      return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
    }
    
    // Comprobar si la rutina debe terminar
    if (!continueRoutine) {  
      return Scheduler.Event.NEXT;
    }
    
    continueRoutine = false; // Cambiar a true si al menos un componente sigue activo
    for (const thisComponent of thanksComponents) {
      if ('status' in thisComponent && thisComponent.status !== PsychoJS.Status.FINISHED) {
        continueRoutine = true;
        break;
      }
    }

    // Refrescar la pantalla si continúa la rutina
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
        thisComponent.setAutoDraw(false); // Apagar componentes gráficos
      }
    }
    psychoJS.experiment.addData('thanks.stopped', globalClock.getTime());

    if (thanksMaxDurationReached) {
        thanksClock.add(thanksMaxDuration); // Añadir tiempo máximo si aplica
    } else {
        thanksClock.add(2.000000); // Tiempo predeterminado de duración
    }

    // Avanzar el registro de datos si es necesario
    if (currentLoop === psychoJS.experiment) {
      psychoJS.experiment.nextEntry(snapshot);
    }
    return Scheduler.Event.NEXT;
  };
}

function importConditions(currentLoop) {
  return async function () {
    psychoJS.importAttributes(currentLoop.getCurrentTrial());
    return Scheduler.Event.NEXT;
  };
}

async function quitPsychoJS(message, isCompleted) {
  // Comprobar y guardar datos no asociados
  if (psychoJS.experiment.isEntryEmpty()) {
    psychoJS.experiment.nextEntry();
  }
  document.documentElement.style.cursor = 'auto'; // Restablecer el cursor al final
  psychoJS.window.close();
  psychoJS.quit({message: message, isCompleted: isCompleted});
  
  return Scheduler.Event.QUIT;
}
