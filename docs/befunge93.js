// Copyright (c) 2011 Xueqiao Xu <xueqiaoxu@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.


var canvas, context;
var bufferCanvas, bufferContext;
var stackBox;
var codeBox;
var outputBox;
var rowHeight, columnWidth;

var codeMatrix; // 2d array storing the codes
var stack;      // program stack
var pcX, pcY;   // program counter coordinate
var direction;  // program counter direction
var stringMode; // bool value indicating whether is in string mode
var skipNext;   // bool value indicating whether to skip next code
var output;     // standard output of the program
var end;        // bool value indicating the termination of program

const LINECOLOR = "#CCC",
      TEXTCOLOR = "#333",
      CURSORCOLOR = "#F96"
      FONT = "14px sans";
const CODEWIDTH = 50, 
      CODEHEIGHT = 12;
const STACKCAPACITY = 14;
const LEFT = 0, RIGHT = 1, UP = 2, DOWN = 3;

function push(n) {
    stack.push(n);
}

function pop() {
    if (stack.length != 0) {
        return stack.pop();
    } else {
        return 0;
    }
}

// move PC
function move() {
    switch (direction) {
        case LEFT:
            --pcX;
            if (pcX < 0) {
                pcX = CODEWIDTH - 1;
            }
            break;
        case RIGHT:
            ++pcX;
            if (pcX >= CODEWIDTH) {
                pcX = 0;
            }
            break;
        case UP:
            --pcY;
            if (pcY < 0) {
                pcY = CODEHEIGHT - 1;
            }
            break;
        case DOWN:
            ++pcY;
            if (pcY >= CODEHEIGHT) {
                pcY = 0;
            }
            break;
    }
}

var instructions = {
    '0': function() {push(0);},
    '1': function() {push(1);},
    '2': function() {push(2);},
    '3': function() {push(3);},
    '4': function() {push(4);},
    '5': function() {push(5);},
    '6': function() {push(6);},
    '7': function() {push(7);},
    '8': function() {push(8);},
    '9': function() {push(9);},
    '+': function() {push(pop() + pop());},
    '-': function() {var tmp = pop(); push(pop() - tmp);},
    '*': function() {push(pop() * pop());},
    '/': function() {var tmp = pop(); push(parseInt(pop() / tmp));},
    '%': function() {var tmp = pop(); push(pop() % tmp);},
    '!': function() {push(pop() == 0 ? 1 : 0);}, 
    '`': function() {var tmp = pop(); push((pop() > tmp) ? 1 : 0);},
    '>': function() {direction = RIGHT;},
    '<': function() {direction = LEFT;},
    '^': function() {direction = UP;},
    'v': function() {direction = DOWN;},
    '?': function() {direction = parseInt(Math.random() * 4);},
    '_': function() {direction = (pop() == 0 ? RIGHT : LEFT);},
    '|': function() {direction = (pop() == 0 ? DOWN : UP);},
    '\"': function() {stringMode = true;},
    ':': function() {var tmp = pop(); push(tmp); push(tmp);},
    '\\': function() {var a = pop(); var b = pop(); push(a); push(b);},
    '$': function() {pop();},
    '.': function() {output += pop();},
    ',': function() {output += String.fromCharCode(pop());},
    '#': function() {skipNext = true;},
    'p': function() {
             var x = pop(); var y = pop(); var v = pop(); 
             codeMatrix[y][x] = String.fromCharCode(v);
             updateBufferCanvas(); // code is modified, therefore update
         },
    'g': function() {
             var x = pop(); var y = pop();
             push(codeMatrix[y][x].charCodeAt(0));
         },
    '&': function() {push(parseInt(prompt("Enter a number")));}, 
    '~': function() {push(prompt("Enter a char").charCodeAt(0));},
    '@': function() {end = true;},
    ' ': function() {}
};

function resetInterpreter() {
    pcX = pcY = 0;
    direction = RIGHT;
    stack = [];
    stringMode = false;
    output = "";
    end = false;
    skipNext = false;
}

function step() {
    if (end) {
        return;
    }

    // get instruction code
    var code = codeMatrix[pcY][pcX];

    // execute instruction
    if (!skipNext) {
        if (stringMode) {
            if (code == '"') {
                stringMode = false;
            } else {
                push(code.charCodeAt(0));    
            }
        } else {
            if (!(code in instructions)) {
                alert("invalid code" + code.charCodeAt(0));
            } 
            instructions[code]();
        }
    } else {
        skipNext = false;
    }

    redraw();

    move();
}

function run() {
    step();

    if (!end) {
        // continuously call step every 20ms
        setTimeout(run, 20);
    } 
}

function init() {
    resetInterpreter();
    inputCode();
    redraw();
}

function stop() {
    if (!end) {
        end = true;
    }
}

function clearCanvas(context, canvas) {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function updateBufferCanvas() {
    clearCanvas(bufferContext, bufferCanvas);
    drawGridLines();
    drawGridContents();
}

function drawGridLines() {
    for (var i = 0.5; i < canvas.width; i += columnWidth) {
        bufferContext.moveTo(i, 0);
        bufferContext.lineTo(i, canvas.height);
    } 
    for (var i = 0.5; i < canvas.height; i += rowHeight) {
        bufferContext.moveTo(0, i);
        bufferContext.lineTo(canvas.width, i);
    } 
    bufferContext.strokeStyle = LINECOLOR;
    bufferContext.stroke();
}

function drawGridContents() {
    bufferContext.fillStyle = TEXTCOLOR;
    for (var i = 0; i < CODEHEIGHT; ++i) {
        for (var j = 0; j < CODEWIDTH; ++j) {
            bufferContext.fillText(
                codeMatrix[i][j], 
                j * columnWidth + 3,
                i * rowHeight + 14
            );
        }
    }
}

function clearCodeMatrix() {
    for (var i = 0; i < CODEHEIGHT; ++i) {
        for (var j = 0; j < CODEWIDTH; ++j) {
            codeMatrix[i][j] = ' ';
        }
    }
}

function inputCode() {
    clearCodeMatrix();

    var lines = codeBox.value.split("\n");
    for (var i in lines) {
        for (var j in lines[i]) {
            codeMatrix[i][j] = lines[i][j];
        }
    }
   
    updateBufferCanvas();
    redraw();
}

function updateStack() {
    stackBox.value = "";

    if (stack.length <= STACKCAPACITY) {
        for (var i = 0; i < STACKCAPACITY - stack.length; ++i) {
            stackBox.value += "\n";
        }
    }
    for (var i = stack.length - 1; i >= 0; --i) {
        stackBox.value += stack[i] + "\n";
    }

    // remove last line feed
    stackBox.value = stackBox.value.substr(0, stackBox.value.length - 1);
}

function drawCursor() {
    var x = pcX * columnWidth;
    var y = pcY * rowHeight;
    context.fillStyle = CURSORCOLOR;
    context.fillRect(x, y, columnWidth, rowHeight)
}

function updateOutput() {
    outputBox.value = output;
}

function redraw() {
    clearCanvas(context, canvas);
    drawCursor();
    context.drawImage(bufferCanvas, 0, 0);

    updateStack();
    updateOutput();
}

window.onload = function() {
    // get elements
    canvas = document.getElementById("canvas");
    stackBox = document.getElementById("stackbox");
    codeBox = document.getElementById("codebox");
    outputBox = document.getElementById("output");

    bufferCanvas = document.createElement("canvas");
    bufferCanvas.width = canvas.width;
    bufferCanvas.height = canvas.height;

    var runButton = document.getElementById("runbutton");
    var stepButton = document.getElementById("stepbutton");
    var initButton = document.getElementById("initbutton");
    var stopButton = document.getElementById("stopbutton");

    // set context
    context = canvas.getContext("2d");
    context.strokeStyle = LINECOLOR;
    context.font = FONT;
    context.fillStyle = TEXTCOLOR;

    bufferContext = bufferCanvas.getContext("2d");
    bufferContext.strokeStyle = LINECOLOR;
    bufferContext.font = FONT;
    bufferContext.fillStyle = TEXTCOLOR;

    // calculate width/height
    rowHeight = canvas.height / CODEHEIGHT,
    columnWidth = canvas.width / CODEWIDTH,
    // init matrix
    codeMatrix = new Array(CODEHEIGHT);
    for (var i = 0; i < CODEHEIGHT; ++i) {
        codeMatrix[i] = new Array(CODEWIDTH);
    }
    clearCodeMatrix();


    // bind events handlers
    runButton.onclick = run;
    stepButton.onclick = step;
    initButton.onclick = init;
    stopButton.onclick = stop;

    // init all
    init();

    // show prompt
    codeBox.value = "vv \"Enter Your Code Here\" <\n" + 
                    ">                         ^\n" +
                    " >  ,,,,,,,,,,,,,,,,,,,,@"
}
