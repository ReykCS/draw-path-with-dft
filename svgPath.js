let dim = {w: 0, h: 0};

let width = 1000, height = 1000;

let signalX = [];
let signalY = [];
let signalXFourier = [], signalYFourier = [];

let path = [];

let area;

function preload()  {
    let path = document.getElementById("path");
    let length = Math.floor(path.getTotalLength());
    // console.log(path.getTotalLength());
    // console.log(path.getPointAtLength(0));
    let skip = 20;
    for ( let i = 0; i < length; i+= skip)   {
        let point = path.getPointAtLength(i);
        if ( point.x > dim.w ) dim.w = point.x;
        if ( point.y > dim.h ) dim.h = point.y;
        signalX.push(Math.floor(point.x));
        signalY.push(Math.floor(point.y));
    }

    for ( let i = 0; i < signalX.length; i++)  {
        let pointX = map(signalX[i], 0, dim.w, 0, height / 4);
        let pointY = map(signalY[i], 0, dim.h, 0, height / 4);


        signalX[i] = pointX;
        signalY[i] = pointY;
    }
}

function createFourier(signal)    {
    signalX = [];
    signalY = [];
    let skip = 1;
    for ( let i = 0; i < signal.length; i+= skip)   {
        let point = signal[i];
        signalX[i] = Math.floor(point.x);
        signalY[i] = Math.floor(point.y);
    }
    console.log(signal, signalX, signalY);

    signalYFourier = dft(signalY);
    signalXFourier = dft(signalX);

    signalXFourier.sort((a, b) => b.amp - a.amp);
    signalYFourier.sort((a, b) => b.amp - a.amp);

    N = signalYFourier.length;
    time = 0;
}

let time = 0;
let N = 0;

function setup()  {
    console.log(signalX.length);

    console.log(signalX, signalY);

    createCanvas(width, height);
    
    area = new DrawingArea(0,0, width / 2, height / 2);
    
    signalYFourier = dft(signalY);
    signalXFourier = dft(signalX);
    signalXFourier.sort((a, b) => b.amp - a.amp);
    signalYFourier.sort((a, b) => b.amp - a.amp);
    N = signalY.length;

    console.log(signalY);
}

function draw() {
    background(50);

    area.draw();

    let dy = epicycle(width/ 4, 3 * height/4, signalYFourier, time, HALF_PI);
    let dx = epicycle(3 * width/ 4, height / 4, signalXFourier, time, 0);
    let vector = {x: dx.x, y: dy.y};
    line(dy.x, dy.y, vector.x, vector.y);
    line(dx.x, dx.y, vector.x, vector.y);
    ellipse(vector.x, vector.y, 5);

    path.push(vector);

    //path.unshift(drawFourier(width/4, height/2, 0, test));
    
    time += TWO_PI / N;
    //console.log(path);
    if ( time >= TWO_PI ) {
        time = 0;
        path = [];
    }

    beginShape();
    stroke(200);
    for ( let i = 0; i < path.length; i++) {
        vertex(path[i].x, path[i].y);
    }
    endShape();
    //noLoop();
}

function epicycle(x, y, fourier, time, rotation)  {
    let off = {x: 0, y: 0};
    noFill();
    stroke(200);
    for ( let i = 0; i < fourier.length; i++)   {
        
        let {phase, amp, freq} = fourier[i];
        if ( freq == 0 ) continue;

        let xNew = x + amp * cos(phase + rotation + freq * time);
        let yNew = y + amp * sin(phase + rotation + freq * time);

        ellipse(x + off.x, y + off.y, fourier[i].amp * 2);

        line(x, y, xNew, yNew);
        x = xNew;
        y = yNew;
    }
    return {x, y};

}

function dft(signal)    {
    let fourier = [];
    let N = signal.length;
    for ( let i = 0; i < signal.length; i++)    {
        let re = 0;
        let im = 0;
        for ( let k = 0; k < signal.length; k++)    {
            let angle = (i * k * TWO_PI) / N;
            let amp = signal[k];
            re += amp * cos(angle);
            im -= amp * sin(angle);
        }
        re /= signal.length;
        im /= signal.length;
        let amp = sqrt(re**2 + im**2);
        let phase = atan2(im, re);
        let freq = i;
        //if ( re < 0 ) phase += PI;
        fourier[i] = {re, im, phase, amp, freq};
    }
    console.log(fourier);

    return fourier
}

class DrawingArea {
    constructor(x, y, w, h) {
        this.loc = {x, y};
        this.dim = {w, h};
        
        this.path = [];
    
    }

    draw()  {
        //console.log(this.path);
        fill(200);
        rect(this.loc.x, this.loc.y, this.dim.w, this.dim.h);
        stroke(50);
        beginShape();
        for ( let i of this.path )   {
            vertex(this.loc.x + i.x, this.loc.y + i.y);
        }
        endShape();
    }

    mouseEvent()    {
        if ( mouseX >= this.loc.x && mouseX <= this.loc.x + this.dim.w &&
            mouseY >= this.loc.y && mouseY <= this.loc.y + this.dim.h)  {
            
            this.path.push({x: mouseX - this.loc.x, y: mouseY - this.loc.y});

            if ( this.path.length >= 200) {
                createFourier(this.path);
                this.path.shift();
                path = [];
            }
        }
    }
}

function mousePressed() {
    area.mouseEvent();
}

function mouseDragged() {
    area.mouseEvent();
}