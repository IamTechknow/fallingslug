function elevator() {
	this.width = 640;
	this.height = 32;
	this.y = 0.0; //coordinates of the left corner
	this.gap = 16;
	this.dy = -0.5;
};

//Initialize all the elevators into the array
var elevators = [new elevator(), new elevator(), new elevator()];

var slug = {
	score: 0,
	lives: 0,
	x: 320,
	y: 200,
	dx: 1.0,
	dy: -0.5,
	color: "#FFFF00",
};

//Variables that control the game
var rightDown = false;
var leftDown = false;
var slug_on_ele = false;
var slug_in_gap = false;
var slug_hor = true;
var ele_move = true;
var realscore = 0;
var oldscore = 0;
var user_lives = 0;

//Canvas vars
var ctx;
var m_canvas = document.createElement('canvas');
m_canvas.width = 640;
m_canvas.height = 480;

//Game states
var gameInit = true;
var gameLive = false;
var impale = false;
var ending = false;
var canStartGame = false;
var loseLife = false;
var blink = 0;
var interval = 0;
var requestID = 0;

function start(){ //access the checkbox values if box checked then start game
	slug.lives = 0;
	var x = document.getElementById("settings");
	for (var i = 0; i < x.length; i++)
		if(x.elements[i].checked)
			slug.lives += parseInt(x.elements[i].value);
	prerender();
	init();
}

function init(){
	update_text(); 
	ctx = document.getElementById('tutorial').getContext('2d'); 
	init_elevators();
	slug.x = 320; slug.y = 200; slug.dx = 1.0; slug.dy = -0.5;
	gameInit = true; gameLive = false; ending = false;
	interval = setInterval(function(){draw()}, 1000/60);
}

document.onkeydown = function(event) {
	if (event.keyCode == 39) rightDown = true;
	else if (event.keyCode == 37) leftDown = true;
	//After intro start game when either key pressed
	if(canStartGame && (rightDown || leftDown)) {
		canStartGame = false;
		gameLive = true;
		interval = setInterval(function(){draw()}, 1000/60);
	}
}

document.onkeyup = function(event) {
	if (event.keyCode == 39) rightDown = false;
	else if (event.keyCode == 37) leftDown = false;
}

function get_gap() {
	return 16 + Math.random() * 495;
}

function init_elevator(elevator, where){
	elevator.y = 480 + 160 * where; //start below the canvas
	elevator.gap = get_gap();
}

function init_elevators(){
	ele_move = true;
	for(var i = 0; i < 3; i++)
		init_elevator(elevators[i],i);
}

function update_elevators(){
	if(ele_move) {
		for(var i = 0; i < 3; i++) {
			if(elevators[i].y === 0)
				init_elevator(elevators[i],0);
			else
				elevators[i].y += elevators[i].dy;
		}
	}
}

function update_slug(){
	if (rightDown && slug_hor) slug.x += slug.dx;
	else if (leftDown && slug_hor) slug.x -= slug.dx;
	
	//Check for impalement, if so set vars then return
	if(slug.y <= 8 || slug.y >= 456 || slug.x <= 8 || slug.x >= 616) {
		impale = true;
		ele_move == false;
		slug.dx = 0.0;
		slug.dy = 0.0;
		return; //do not execute statement below
	}
	
	if(Math.abs(slug.y+16 - elevators[0].y) <= 0.5 || Math.abs(slug.y+16 - elevators[1].y) <= 0.5 || Math.abs(slug.y+16 - elevators[2].y) <= 0.5) {
		slug_on_ele = true; slug_in_gap = false;
	}
	else 
		slug_on_ele = false; //Should go down instead
	
	if(Math.abs(slug.x - elevators[0].gap) <= 0.5 && slug.y+18 > elevators[0].y && slug.y-10 < elevators[0].y+24 || 
	   Math.abs(slug.x - elevators[1].gap) <= 0.5 && slug.y+18 > elevators[1].y && slug.y-10 < elevators[1].y+24 ||
	   Math.abs(slug.x - elevators[2].gap) <= 0.5 && slug.y+18 > elevators[2].y && slug.y-10 < elevators[2].y+24) {
		slug_on_ele = false; slug_hor = false; slug_in_gap = true; slug.score++;
	}
	else {
		slug_hor = true; slug_in_gap = false;
		update_text(); //check if score should be updated
	}
	//Check slug's velocity
	if (ele_move && slug_on_ele) { //going up
		slug.dy = -0.5;
		slug.dx = 1.0;
		slug.y += slug.dy;
	}
	else if (slug_in_gap) { //falling through gap
		slug.dx = 0.0;
		slug.dy = 1.0;
		slug.y += slug.dy;
	}
	else { //free fall case
		slug.dx = 1.0;
		slug.dy = 1.0;
		slug.y += slug.dy;
	}
	
	//While slug is in air, at a certain point check if the distance from the slug and an elevator is not an integer
	//If so, slug will not touch the elevator, fixes this by adding 0.5. Not a complete fix but makes it less common
	if(!slug_on_ele && (elevators[0].y-48 - slug.y == 0.5))
		slug.y += 0.5;
		
	if(!slug_on_ele && (elevators[1].y-48 - slug.y == 0.5))
		slug.y += 0.5;
		
	if(!slug_on_ele && (elevators[2].y-48 - slug.y == 0.5))
		slug.y += 0.5;
}

function update_text() {
	if(slug.score > oldscore) { //"rising edge" mechanism for proper score update
		oldscore = slug.score;
		realscore++;
		if(realscore == 128) //do overflow, only 2 hex digits supported
			realscore = 0;
	}

	if(loseLife) {
		slug.lives--; loseLife = false;
	}
	//display in hex
	var l = document.getElementById("lives");
	l.textContent = "Lives: " + slug.lives.toString(16);
	var s = document.getElementById("score");
	s.textContent = "Score: " + realscore.toString(16);
}

function prerender() { //make spikes once per game for performance boost
	var m_ctx = m_canvas.getContext('2d');
	for(var i = 1; i <= 4; i++) {
		m_ctx.fillStyle="#FF0000";
		var spike = true; var delta = 0;
		if (i === 3)
			delta = 640; //draw spikes at right edge
		else if (i === 4)
			delta = 480; //draw spikes at bottom edge

		m_ctx.beginPath();
		if(i === 1 || i === 3) { //draw left and right spikes
			m_ctx.moveTo(Math.abs(0-delta),0);
			for(var y = 0; y <= 480; y +=4) {
				if(spike)
					m_ctx.lineTo(Math.abs(8-delta),y); //0 or 472
				else
					m_ctx.lineTo(Math.abs(4-delta),y);
				spike = !spike;
			}
			m_ctx.lineTo(Math.abs(0-delta),480);
			m_ctx.closePath();
		}
		else {
			m_ctx.moveTo(0,Math.abs(0-delta));
			for(var x = 0; x <= 640; x +=4) { //draw top and bottom
				if(spike)
					m_ctx.lineTo(x,Math.abs(8-delta));
				else
					m_ctx.lineTo(x,Math.abs(4-delta));
				spike = !spike;
			}
			m_ctx.lineTo(640,Math.abs(0-delta));
			m_ctx.closePath();
		}
		m_ctx.fill();
	}
}

function draw(){
	update_elevators(); 
	if(gameLive && !impale) update_slug();
	
	if(gameInit && elevators[0].y == 216) { //intro over, let player start game
		canStartGame = true; gameInit = false;
		clearInterval(interval); //stop calling draw function
	}
	
	if(!ending) {
		ctx.fillStyle="#000000";
		ctx.fillRect(0,0,640,480);

		//draw each elevator in array
		ctx.fillStyle="#0000FF";
		for(var i = 0; i < 3; i++) {
			ctx.fillRect(0,elevators[i].y,elevators[i].gap,32);
			ctx.fillRect(elevators[i].gap+16,elevators[i].y,640-elevators[i].gap-16,32);
		}

		//Draw the prerendered spikes
		ctx.drawImage(m_canvas, 0, 0);
		
		//draw slug
		if(!gameInit && (blink % 22 <= 10)) { //blink also for ending and switches color once only 10ms
			ctx.fillStyle=slug.color;
			ctx.fillRect(slug.x,slug.y,16,16);
		}
	}
	
	if(ending) { //drawing for ending, a screen flash
	requestID = requestAnimationFrame(function() {
		blink++; impale = false;
		if(blink % 22 <= 10)
			ctx.fillStyle="#0000FF";
		else
			ctx.fillStyle="#FFFF00";
					
		ctx.fillRect(0,0,640,480);
		});
	} 
	
	if(impale) { //do blink then clear interval and go to init()
		ele_move = false; blink++;
		
		if(blink >= 239) { //blink done
			loseLife = true;
			if(slug.lives == 0){ //dramatic ending after blink
				ending = true; impale = false; //setting impale false here so code is not reached again
			}
		}
	}
	
	if((impale && blink == 240) || (ending && blink >= 680)) { //start new round
		if(ending) { realscore = 0; slug.score = 0; oldscore = 0; loseLife = false; cancelAnimationFrame(requestID);}
		impale = false; blink = 0; 
		clearInterval(interval); 
		if(ending) 
			start();
		else
			init();
	}
}
