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

// Variables para el flujo y configuraciones globales
var currentLoop;
var frameDur;
var emailjsConfig = {};
var errorSound; // Variable global para el sonido de error

// Inicializar PsychoJS
const psychoJS = new PsychoJS({
  debug: true
});

// Abrir la ventana:
psychoJS.openWindow({
  fullscr: true,
  color: new util.Color([(- 0.67), (- 0.67), (- 0.67)]),
  units: 'height', // Usaremos unidades estándar 'height'
  waitBlanking: true,
  backgroundImage: '',
  backgroundFit: 'none',
});

// Activar el servidor y cargar configuración
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
    emailjs.init(emailjsConfig.userID); // Inicializar EmailJS con la clave de usuario
  })
  .catch(error => {
    console.error('Error al cargar la configuración de EmailJS:', error);
    alert('No se pudo cargar la configuración del servidor. Por favor, intenta más tarde.');
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

// Programar el experimento
psychoJS.schedule(psychoJS.gui.DlgFromDict({
  dictionary: expInfo,
  title: expName
}));

const flowScheduler = new Scheduler(psychoJS);
const dialogCancelScheduler = new Scheduler(psychoJS);
psychoJS.scheduleCondition(
  function() { return (psychoJS.gui.dialogComponent.button === 'OK'); }, 
  flowScheduler, 
  dialogCancelScheduler
);

// flowScheduler se ejecuta si los participantes presionan OK
flowScheduler.add(updateInfo); // Añadir timeStamp
flowScheduler.add(experimentInit); // Llamar al inicio del experimento para configurar el sonido y otros elementos
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
flowScheduler.add(endExperiment); // Llamar a la función para terminar el experimento
flowScheduler.add(quitPsychoJS, '', true);

// Terminar si el usuario presiona Cancelar en el cuadro de diálogo
dialogCancelScheduler.add(quitPsychoJS, '', false);

psychoJS.start({
  expName: expName,
  expInfo: expInfo,
  resources: [
    // Resources:
    {'name': 'conditions.xlsx', 'path': 'conditions.xlsx'},
    {'name': 'error.wav', 'path': 'error.wav'} // Archivo de sonido de error
  ]
});

psychoJS.experimentLogger.setLevel(core.Logger.ServerLevel.EXP);

// Función para actualizar información básica
async function updateInfo() {
  currentLoop = psychoJS.experiment; // No hay bucles ahora
  expInfo['date'] = util.MonotonicClock.getDateStr(); // Timestamp simple
  expInfo['expName'] = expName;
  expInfo['psychopyVersion'] = '2024.2.4';
  expInfo['OS'] = window.navigator.platform;

  // Obtener la tasa de fotogramas del monitor
  expInfo['frameRate'] = psychoJS.window.getActualFrameRate();
  if (typeof expInfo['frameRate'] !== 'undefined') {
    frameDur = 1.0 / Math.round(expInfo['frameRate']);
  } else {
    frameDur = 1.0 / 60.0; // Asumimos un valor por defecto si falla la medición
  }

  // Añadir información desde la URL
  util.addInfoFromUrl(expInfo);

  psychoJS.experiment.dataFileName = 
    `data/${expInfo["participant"]}_${expName}_${expInfo["date"]}`; // Nombre del archivo de datos

  return Scheduler.Event.NEXT;
}


// Función para enviar los resultados del experimento por correo
function sendExperimentResults() {
  let data = psychoJS.experiment._trialsData;

  let plainTextContent = `PARTICIPANTE (teléfono): ${expInfo['Escribe tu teléfono, por favor']}\n\n`;
  plainTextContent += `Test del Trazo - Tiempos fase A y B:\n\n`;

  // Procesar datos por condición
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
    .then(response => {
      console.log('Correo enviado con éxito:', response.status, response.text);
      alert('¡Correo enviado exitosamente!');
    })
    .catch(error => {
      console.error('Error al enviar el correo:', error);
      alert(`Error al enviar el correo: ${error.text}`);
    });
}

console.log("Probando posición:", trialTargets[Idx].pos);











// Función para finalizar el experimento
function endExperiment() {
  console.log('Experimento finalizado.');

  // Guardar los errores por etapa
  psychoJS.experiment.addData('ErroresSampleA', errorCountSampleA);
  psychoJS.experiment.addData('ErroresA', errorCountA);
  psychoJS.experiment.addData('ErroresSampleB', errorCountSampleB);
  psychoJS.experiment.addData('ErroresB', errorCountB);

  sendExperimentResults(); // Enviar los resultados del experimento
  psychoJS.experiment.save();
  psychoJS.quit({
    message: 'Gracias por tu paciencia. ¡Acabas de completar todas las pruebas!',
    isCompleted: true
  });
}

// Agregar la función de finalización al flujo
flowScheduler.add(endExperiment);

// Declaración de variables globales para la configuración
var setupClock;
var white;
var green;
var alphabet;
var fontColor;
var trialText = []; // Inicializar como un arreglo
var trialTargets = []; // Inicializar como un arreglo
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
  
  // Cambiar cursor y colores para la interfaz del experimento
  document.documentElement.style.cursor = 'auto';
  white = new util.Color([.9, .9, .9]);
  green = new util.Color([(-.5), .5, (-.5)]);

  // Inicializar alfabetos, colores y contenedores
  alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  fontColor = [0.9, 0.9, 0.9];
  trialText = [];
  trialTargets = [];
  
  // Definir los objetivos visuales y sus posiciones
  for (let Idx = 0; Idx < 25; Idx++) {
    trialText.push(new visual.TextStim({
        win: psychoJS.window,
        name: `trialText${Idx}`,
        text: " ", // Texto inicial vacío
        font: "Arial",
        pos: [0, -0.4], // Posición inicial, ajustada dinámicamente después
        height: 0.06,
        wrapWidth: null,
        ori: 0,
        color: white
    }));

    trialTargets.push(new visual.Polygon({
        win: psychoJS.window,
        name: `target${Idx}`,
        fillColor: white,
        lineColor: white,
        edges: 36,
        pos: [0, -0.4], // Posición inicial
        opacity: 0.25,
        size: 0.1
    }));
  }
  
  // Inicializar el reloj del experimento
  myClock = new util.Clock();
  
  // Initialize components for Routine "instr"
  instrClock = new util.Clock();
  instrText = new visual.TextStim({
    win: psychoJS.window,
    name: 'instrText',
    text: '', // Texto dinámico para las instrucciones
    font: 'Arial',
    units: 'height', // Usar unidades de altura
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
    win: psychoJS.window, 
    name: 'clickHere', 
    edges: 100, 
    size: [0.1, 0.1],
    ori: 0.0, 
    pos: [0, -0.3], 
    draggable: false, 
    anchor: 'center', 
    lineWidth: 1.0, 
    lineColor: new util.Color('lightgreen'), 
    fillColor: new util.Color('lightgreen'), 
    opacity: 1.0, 
    depth: -3, 
    interpolate: true, 
  });
  
  // Initialize components for Routine "trial"
  trialClock = new util.Clock();
  trialMouse = new core.Mouse({
    win: psychoJS.window,
  });
  trialMouse.mouseClock = new util.Clock();

  trialCursor = new visual.Polygon({
    win: psychoJS.window, 
    name: 'trialCursor', 
    edges: 180, 
    size: [0.025, 0.025],
    ori: 0.0, 
    pos: [0, -0.3], 
    draggable: false, 
    anchor: 'center', 
    lineWidth: 1.0, 
    lineColor: new util.Color([1, 1, 1]), 
    fillColor: new util.Color([1, 1, 1]), 
    opacity: 1.0, 
    depth: -2, 
    interpolate: true,
  });
  
  // Initialize components for Routine "thanks"
  thanksClock = new util.Clock();
  thx_text = new visual.TextStim({
    win: psychoJS.window,
    name: 'thx_text',
    text: 'Fin', // Mensaje final del experimento
    font: 'Arial',
    units: 'height', 
    pos: [0, -0.3], draggable: false, height: 0.05, wrapWidth: undefined, ori: 0.0,
    languageStyle: 'LTR',
    color: new util.Color(fontColor), opacity: 1.0,
    depth: 0.0 
  });
  
  // Crear temporizadores útiles
  globalClock = new util.Clock();  // Registrar el tiempo total del experimento
  routineTimer = new util.CountdownTimer();  // Contador para rutinas específicas
  
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
    TrialHandler.fromSnapshot(snapshot); // Asegurar que las variables internas estén actualizadas
    
    //--- Preparar para iniciar la rutina 'setup' ---
    t = 0;
    frameN = -1;
    continueRoutine = true; // Hasta que se indique lo contrario
    setupClock.reset();
    routineTimer.reset();
    setupMaxDurationReached = false;

    // Registrar el inicio de la rutina en los datos
    psychoJS.experiment.addData('setup.started', globalClock.getTime());
    setupMaxDuration = null;

    // Inicializar los componentes que serán utilizados en esta rutina
    setupComponents = [];
    // Aquí puedes agregar componentes adicionales a setupComponents si es necesario

    for (const thisComponent of setupComponents)
      if ('status' in thisComponent)
        thisComponent.status = PsychoJS.Status.NOT_STARTED;

    return Scheduler.Event.NEXT;
  };
}

function setupRoutineEachFrame() {
  return async function () {
    //--- Loop para cada frame de la rutina 'setup' ---
    // Obtener el tiempo actual
    t = setupClock.getTime();
    frameN = frameN + 1; // Número de frames completados (0 es el primer frame)

    // Revisar si se presiona la tecla Esc para salir
    if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
      return quitPsychoJS('La tecla [Escape] fue presionada. Adiós!', false);
    }
    
    // Verificar si la rutina debe terminar
    if (!continueRoutine) {  
      return Scheduler.Event.NEXT;
    }
    
    continueRoutine = false;  // Cambiar a true si al menos un componente sigue activo
    for (const thisComponent of setupComponents)
      if ('status' in thisComponent && thisComponent.status !== PsychoJS.Status.FINISHED) {
        continueRoutine = true;
        break;
      }
    
    // Refrescar pantalla si continúa la rutina
    if (continueRoutine) {
      return Scheduler.Event.FLIP_REPEAT;
    } else {
      return Scheduler.Event.NEXT;
    }
  };
}

function setupRoutineEnd(snapshot) {
  return async function () {
    //--- Finalizar la rutina 'setup' ---
    for (const thisComponent of setupComponents) {
      if (typeof thisComponent.setAutoDraw === 'function') {
        thisComponent.setAutoDraw(false);
      }
    }

    // Registrar el fin de la rutina
    psychoJS.experiment.addData('setup.stopped', globalClock.getTime());
    // Restablecer el temporizador no deslizante
    routineTimer.reset();
    
    // Las rutinas que se ejecutan fuera de un bucle deben avanzar siempre la fila del archivo de datos
    if (currentLoop === psychoJS.experiment) {
      psychoJS.experiment.nextEntry(snapshot);
    }

    return Scheduler.Event.NEXT;
  };
}

var trials;

function trialsLoopBegin(trialsLoopScheduler, snapshot) {
  return async function() {
    TrialHandler.fromSnapshot(snapshot); // Asegurar que las variables internas del loop estén actualizadas

    // Configurar el manejador para la aleatorización de condiciones, etc.
    trials = new TrialHandler({
      psychoJS: psychoJS,
      nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
      extraInfo: expInfo, originPath: undefined,
      trialList: 'conditions.xlsx', // Importar los datos desde el archivo
      seed: undefined, name: 'trials'
    });

    psychoJS.experiment.addLoop(trials); // Añadir el loop al experimento
    currentLoop = trials;  // Asignar el loop actual

    // Programar todos los ensayos en la lista de ensayos
    for (const thisTrial of trials) {
      snapshot = trials.getSnapshot();
      trialsLoopScheduler.add(importConditions(snapshot)); // Importar condiciones de cada fase
      trialsLoopScheduler.add(instrRoutineBegin(snapshot));
      trialsLoopScheduler.add(instrRoutineEachFrame());
      trialsLoopScheduler.add(instrRoutineEnd(snapshot));
      trialsLoopScheduler.add(trialRoutineBegin(snapshot));
      trialsLoopScheduler.add(trialRoutineEachFrame()); // Función clave
      trialsLoopScheduler.add(trialRoutineEnd(snapshot));
      trialsLoopScheduler.add(trialsLoopEndIteration(trialsLoopScheduler, snapshot));
    }
    
    return Scheduler.Event.NEXT;
  };
}

async function trialsLoopEnd() {
  // Finalizar el loop
  psychoJS.experiment.removeLoop(trials);

  // Actualizar el loop actual desde el ExperimentHandler
  if (psychoJS.experiment._unfinishedLoops.length > 0) {
    currentLoop = psychoJS.experiment._unfinishedLoops.at(-1);
  } else {
    currentLoop = psychoJS.experiment;  // Usar addData desde el experimento
  }

  return Scheduler.Event.NEXT;
}

function trialsLoopEndIteration(scheduler, snapshot) {
  // ------Preparar para la siguiente entrada------
  return async function () {
    if (typeof snapshot !== 'undefined') {
      // ------Revisar si el usuario terminó el loop temprano------
      if (snapshot.finished) {
        // Verificar y guardar datos huérfanos
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
    TrialHandler.fromSnapshot(snapshot); // Asegurar que las variables internas estén actualizadas
    
    //--- Preparar para iniciar la rutina 'instr' ---
    t = 0;
    frameN = -1;
    continueRoutine = true; // Hasta que se indique lo contrario
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
    msg = msg.slice(0, (-2)); // Eliminar la última coma
    psychoJS.experiment.addData("Condition", Condition); // Registrar la condición actual
    
    // Actualizar las instrucciones para el usuario
    instrText.setText("\n\n\n\n\n\nINSTRUCCIONES:\n\n1. Usa tu ratón para trazar una línea que conecte los círculos en el orden correcto.\n2. Hazlo lo más rápido posible.\n3. Sigue este orden: " + msg + ".\n\n\n\nPara comenzar, pasa el cursor por el primer círculo.");

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
    //--- Loop por cada frame de la rutina 'instr' ---
    t = instrClock.getTime();
    frameN += 1;

    // Detectar si el ratón pasa por encima del objetivo inicial
    if (clickHere.contains(mouse.getPos())) { // Si el cursor está sobre el objetivo
      gotValidHover = true;
      continueRoutine = false; // Continuar con el experimento
    }

    // *clickHere* actualizaciones
    if (t >= 0.0 && clickHere.status === PsychoJS.Status.NOT_STARTED) {
      clickHere.tStart = t;
      clickHere.frameNStart = frameN;
      clickHere.setAutoDraw(true);
    }

    // Comprobar si se presiona la tecla Esc para salir
    if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
      return quitPsychoJS('La tecla [Escape] fue presionada. Adiós!', false);
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

    continueRoutine = false; // Cambiar a true si al menos un componente sigue activo
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
    // Restablecer el temporizador no deslizante
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
    console.log("Cantidad de objetivos:", targetList.length);

    for (let Idx = 0; Idx < targetList.length; Idx++) {
      trialTargets[Idx].setPos([((posArray1[Idx] / 1000) - 0.5), (0.5 - (posArray2[Idx] / 1000))]);
      trialTargets[Idx].setAutoDraw(true);
      trialText[Idx].setPos([((posArray1[Idx] / 1000) - 0.5), (0.5 - (posArray2[Idx] / 1000))]);
      trialText[Idx].text = targetList[Idx];
      trialText[Idx].setColor(white);
      trialText[Idx].setAutoDraw(true);
    }

    trialStep = 0;
    shapeList = [];

    // Preparar componentes de la rutina
    gotValidClick = false;
    trialMouse.mouseClock.reset();
    psychoJS.experiment.addData('trial.started', globalClock.getTime());
    trialMaxDuration = null;

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
    TrialHandler.fromSnapshot(snapshot); // Asegurar que las variables internas estén actualizadas
    
    //--- Preparar para iniciar la rutina 'thanks' ---
    t = 0;
    frameN = -1;
    continueRoutine = true; // Hasta que se indique lo contrario
    thanksClock.reset(routineTimer.getTime());
    routineTimer.add(2.000000); // Duración de la rutina de agradecimiento
    thanksMaxDurationReached = false;

    // Registrar el inicio de la rutina
    psychoJS.experiment.addData('thanks.started', globalClock.getTime());
    thanksMaxDuration = null;

    // Inicializar los componentes de la rutina
    thanksComponents = [];
    thanksComponents.push(thx_text);
    
    for (const thisComponent of thanksComponents)
      if ('status' in thisComponent)
        thisComponent.status = PsychoJS.Status.NOT_STARTED;

    return Scheduler.Event.NEXT;
  };
}











var CursorTargetDistance;

function trialRoutineEachFrame() {
  return async function () {
    //--- Loop por cada frame de la rutina 'trial' ---
    // Obtener el tiempo actual y actualizar el frame
    t = trialClock.getTime();
    frameN += 1;

    // Verificar si el tiempo máximo permitido ha sido alcanzado (opcional)
    if (myClock.getTime() > 600) {
      continueRoutine = false;
      trials.finished = true;
    }

    // Calcular la distancia del cursor al objetivo esperado
    CursorTargetDistance = Math.sqrt(
      Math.pow((trialCursor.pos[0] - trialTargets[trialStep].pos[0]), 2) +
      Math.pow((trialCursor.pos[1] - trialTargets[trialStep].pos[1]), 2)
    );

    if (CursorTargetDistance < 0.05) { // Si el cursor está cerca del objetivo esperado
      if (trialTargets[trialStep].text === targetList[trialStep]) {
        // Objetivo correcto: actualizar el color y avanzar al siguiente
        trialText[trialStep].setColor(green);

        if (trialStep > 0) {
          // Dibujar una línea entre el objetivo anterior y el actual
          shapeList.push(new visual.ShapeStim({
            win: psychoJS.window,
            name: "line" + trialStep.toString(),
            lineColor: white,
            lineWidth: 2,
            vertices: [
              [((posArray1[trialStep - 1] / 1000) - 0.5), (0.5 - (posArray2[trialStep - 1] / 1000))],
              [((posArray1[trialStep] / 1000) - 0.5), (0.5 - (posArray2[trialStep] / 1000))]
            ]
          }));
          shapeList[shapeList.length - 1].setAutoDraw(true);
        }

        // Registrar tiempo de reacción y avanzar
        psychoJS.experiment.addData("RTstep" + trialStep.toString(), Math.round(t * 1000));
        trialStep += 1;

        // Si se completó el trazo correctamente
        if (trialStep === targetList.length) {
          continueRoutine = false;
          psychoJS.experiment.addData("Score", Math.round(t)); // Registrar el tiempo total
        }
      } else {
        // Objetivo incorrecto: manejar el error
        handleError();
      }
    }

    // Actualizar la posición del cursor en la pantalla
    if (trialCursor.status === PsychoJS.Status.STARTED) {
      trialCursor.setPos([trialMouse.getPos()[0], trialMouse.getPos()[1]], false);
    }

    // Activar el cursor si no ha comenzado
    if (t >= 0.0 && trialCursor.status === PsychoJS.Status.NOT_STARTED) {
      trialCursor.tStart = t;
      trialCursor.frameNStart = frameN;
      trialCursor.setAutoDraw(true);
    }

    // Comprobar si se presiona la tecla Esc para salir
    if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({keyList: ['escape']}).length > 0) {
      return quitPsychoJS('La tecla [Escape] fue presionada. Adiós!', false);
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
    //--- Finalizar la rutina 'trial' ---
    for (const thisComponent of trialComponents) {
      if (typeof thisComponent.setAutoDraw === 'function') {
        thisComponent.setAutoDraw(false);
      }
    }

    psychoJS.experiment.addData('trial.stopped', globalClock.getTime());

    // Apagar los objetivos y las líneas al final de la rutina
    for (let Idx = 0; Idx < targetList.length; Idx++) {
      trialTargets[Idx].setAutoDraw(false);
      trialText[Idx].setAutoDraw(false);
    }

    for (let Idx = 0; Idx < shapeList.length; Idx++) {
      shapeList[Idx].setAutoDraw(false);
    }

    // Registrar datos de la posición del ratón
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
    //--- Loop por cada frame de la rutina 'thanks' ---
    // Obtener el tiempo actual y actualizar el frame
    t = thanksClock.getTime();
    frameN += 1; // Incrementar el número de frames completados

    // Actualizar y mostrar el texto de agradecimiento
    if (t >= 0.0 && thx_text.status === PsychoJS.Status.NOT_STARTED) {
      thx_text.tStart = t; // Registrar tiempo de inicio
      thx_text.frameNStart = frameN; // Guardar el número de frame inicial
      
      thx_text.setAutoDraw(true); // Mostrar el texto de agradecimiento
    }
    
    frameRemains = 0.0 + 2 - psychoJS.window.monitorFramePeriod * 0.75; // Calcular tiempo restante
    if (thx_text.status === PsychoJS.Status.STARTED && t >= frameRemains) {
      thx_text.setAutoDraw(false); // Apagar el texto de agradecimiento
    }
    
    // Comprobar si se presiona la tecla Esc para salir
    if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({keyList: ['escape']}).length > 0) {
      return quitPsychoJS('La tecla [Escape] fue presionada. Adiós!', false);
    }
    
    // Revisar si la rutina debe terminar
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

    // Refrescar pantalla si la rutina continúa
    if (continueRoutine && routineTimer.getTime() > 0) {
      return Scheduler.Event.FLIP_REPEAT;
    } else {
      return Scheduler.Event.NEXT;
    }
  };
}

function thanksRoutineEnd(snapshot) {
  return async function () {
    //--- Finalizar la rutina 'thanks' ---
    for (const thisComponent of thanksComponents) {
      if (typeof thisComponent.setAutoDraw === 'function') {
        thisComponent.setAutoDraw(false); // Apagar cualquier componente visual
      }
    }
    
    // Registrar el momento en que la rutina 'thanks' termina
    psychoJS.experiment.addData('thanks.stopped', globalClock.getTime());

    // Añadir tiempo máximo o predeterminado al reloj
    if (thanksMaxDurationReached) {
      thanksClock.add(thanksMaxDuration);
    } else {
      thanksClock.add(2.000000); // Tiempo predeterminado para finalizar la rutina
    }

    // Avanzar en el archivo de datos si aplica
    if (currentLoop === psychoJS.experiment) {
      psychoJS.experiment.nextEntry(snapshot);
    }
    
    return Scheduler.Event.NEXT;
  };
}

function importConditions(currentLoop) {
  return async function () {
    // Importar las condiciones actuales desde el bucle
    psychoJS.importAttributes(currentLoop.getCurrentTrial());
    return Scheduler.Event.NEXT;
  };
}

async function quitPsychoJS(message, isCompleted) {
  //--- Finalizar el experimento y guardar datos ---
  // Verificar si hay datos no guardados y registrarlos
  if (psychoJS.experiment.isEntryEmpty()) {
    psychoJS.experiment.nextEntry();
  }

  // Restablecer el cursor y cerrar la ventana del experimento
  document.documentElement.style.cursor = 'auto';
  psychoJS.window.close();

  // Salir del experimento con un mensaje final
  psychoJS.quit({message: message, isCompleted: isCompleted});
  
  return Scheduler.Event.QUIT;
}
