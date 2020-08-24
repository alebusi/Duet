/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*---------------------------------------------           Circle constructor        ----------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
class Circle {
	constructor(cx, cy, rad, offset, color) {
		this.cx = cx;
		this.cy = cy;
		this.rad = rad;
		this.offset = offset;
		this.color = color;
	}
	rotate() {
		this.cx = game.orbit.cx + game.orbit.rad * cos(this.offset + game.deg);
		this.cy = game.orbit.cy + game.orbit.rad * sin(this.offset + game.deg);
	}
}

/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*---------------------------------------------           Score constructor        ----------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
class Score {
	constructor(name) {
		this.name = name;
		this.score = 0;
	}
}

/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------           Powerup constructor        ----------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
class PowerUp {
	constructor(name) {
		this.name = name;
		this.cx = game.orbit.cx + (Math.random() - 0.5) * 2 * game.orbit.rad;
		this.cy = 0.1 * vh;
		this.rad = 20;
		if (this.name == 'flight')
			this.color = 'yellow';
		else
			this.color = 'red';
		this.dy = 0.01 * vh;
	}

	move() {
		this.cy += this.dy;
		for (var i=0; i<2; i++) {
			if (this.check_y(window.balls[i])) {
				if (this.check_x(window.balls[i])) {
					if (this.name == 'flight')
						game.deg_jump = (game.deg_jump * 10 + 1) / 10;
					else
						window.balls[i].rad -= 1;

					this.remove();
					break;
				}
			}
		}
		if (this.cy > vh)
			this.remove();
	}

	check_y(ball) {
		var bar = ball.cy + ball.rad;
		return (this.cy - this.rad < bar && this.cy + this.rad > bar)
	}
	check_x(ball) {
		var bar = ball.cx - ball.rad;
		return ((this.cx - this.rad < bar && this.cx + this.rad > bar) || (this.cx - this.rad > bar && this.cx - this.rad < bar + 2 * ball.rad && this.cx + this.rad > bar))
	}
	remove() {
		game.powerups.splice(game.powerups.indexOf(this), 1);
	}

}

/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*---------------------------------------------           Hurdle constructor        ----------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
class Hurdle {
	constructor(x, width, color) {
		this.x = x + 0.5 * window.vw - 150;
		this.y = 0.1 * window.vh;
		this.width = width;
		this.height = 30;
		this.color = '#' + color;
		this.dy = 0.01 * window.vh;
	}
	move() {
		this.y += this.dy;
		for (var i=0; i<2; i++) {
			if (this.check_y(window.balls[i])) {
				if (this.check_x(window.balls[i])) {
					game.game_over = true;
					game.stop();
					break;
				}
			}
		}
		if (this.y > window.vh)
			this.remove();
	}
	remove() {
		game.hurdles.splice(game.hurdles.indexOf(this), 1);
		game.change_score(1);
	}
	check_y(ball) {
		var bar = ball.cy + ball.rad;
		return (this.y < bar && this.y + this.height > bar)
	}
	check_x(ball) {
		var bar = ball.cx - ball.rad;
		return ((this.x < bar && this.x + this.width > bar) || (this.x > bar && this.x < bar + 2 * ball.rad && this.x + this.width > bar))
	}
}
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------           Painter constructor        ----------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
class Painter {
	constructor(game) {
		this.game = game;
	}
	fill_rect(el) {
		var ctx = this.game.ctx;
		ctx.beginPath();
		ctx.rect(el.x, el.y, el.width, el.height);
		ctx.fillStyle = el.color;
		ctx.closePath();
		ctx.fill();
	}

	stroke_circle(el) {
		var ctx = this.game.ctx;
		ctx.beginPath();
		ctx.arc(el.cx, el.cy, el.rad, 0, 2*Math.PI);
		ctx.strokeStyle = el.color;
		ctx.closePath();
		ctx.stroke();
	}

	fill_circle(el) {
		var ctx = this.game.ctx;
		ctx.beginPath();
		ctx.arc(el.cx, el.cy, el.rad, 0, 2*Math.PI);
		ctx.fillStyle = el.color;
		ctx.closePath();
		ctx.fill();
	}

	draw() {
		var game = this.game;
		var ctx = game.ctx;
		var hurdles = game.hurdles;
		var powerups = game.powerups;
		ctx.clearRect(0, 0, window.vw, window.vh);
		ctx.beginPath();
		ctx.rect(0, 0, window.vw, window.vh);
		ctx.fillStyle = '#000000';
		ctx.fill();
		ctx.closePath();
		this.stroke_circle(game.orbit);
		this.fill_circle(game.wBall);
		this.fill_circle(game.bBall);
		for (var i=0; i<hurdles.length; i++) {
			ctx.beginPath();
			this.fill_rect(hurdles[i]);
			ctx.closePath();
			hurdles[i].move();
		}
		for (var i=0; i<powerups.length; i++) {
			ctx.beginPath();
			this.fill_circle(powerups[i]);
			ctx.closePath();
			powerups[i].move();
		}
	}

	create_hurdles() {
		var game = this.game;
		var hurdles = game.hurdles;
		this.hurdle_factory = setInterval(function() {
			var x = Math.random() * 200;
			var width = 80 + Math.random() * 40;
			hurdles.push(new Hurdle(x, width, '1c3a56', window.vw, window.vh));
		}, 1000 - game.speed * 200);
	}

	create_powerups() {
		var powerups = game.powerups;
		var powerup_names = game.powerup_names;
		this.powerup_factory = setInterval(function() { 	
			if (Math.random() < 0.05) {
				powerups.push(new PowerUp(powerup_names[Math.round(Math.random())]));
			}
		}, 1000);
	}

	clear() {
		ctx.clearRect(0, 0, this.game.canvas.width, this.game.canvas.height);
	}
}

/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*----------------------------------------------           Game constructor        ------------------------------------------------ */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
class Game {
	constructor() {
		window.vw = window.innerWidth;
		window.vh = window.innerHeight;
		var body = body = document.getElementsByTagName('body')[0];

		this.canvas = document.getElementsByTagName('canvas')[0];
		this.ctx = this.canvas.getContext('2d');
		this.canvas.height = window.vh;
		this.canvas.width = window.vw;
		
		this.scores = [];
		
		body.addEventListener('keydown', ev => this.move(ev));
		body.addEventListener('keyup', ev => this.move(ev));
		body.addEventListener('touchstart', ev => this.move(ev));
		body.addEventListener('touchend', ev => this.move(ev));
		body.addEventListener('touchcancel', ev => this.move(ev));

		this.init();
	}

	init() {
		this.orbit = new Circle(0.5 * window.vw, window.vh - 150, 100, 0, '#31bbfc');
		this.wBall = new Circle(this.orbit.cx - this.orbit.rad, this.orbit.cy, 20, 180, '#ffffff');
		this.bBall = new Circle(this.orbit.cx + this.orbit.rad, this.orbit.cy, 20, 0, '#FF0000');
		window.balls = [this.wBall, this.bBall];
		
		this.ongoing = false;
		this.game_over = false;
		this.speed = 0;

		this.hurdles = [];
		this.powerups = [];
		this.powerup_names = ['horlicks', 'flight'];
		this.last_powerup = 0;
		this.painting = 0;
		this.kd = false;
		
		this.score = document.getElementById('score-board');
		this.score_pos = this.scores.length;
		/*
		var name = prompt('Enter name: ');
		while (name == '' || name == null)
			name = prompt('Enter name: ');
		*/
		this.canvas.style.display = 'block';
		this.scores.push(new Score(name));
		this.change_score(0);
		if (window.vw < 600) {
			score_board.style.left = '0px';
			toggle_score();
		}
		else {
			show.style.display = 'none';
			info.style.top = 30 + score_board.offsetHeight + 'px';
		}
			score_board.style.left = '0px';
			toggle_score();
		info.style.color = 'white';

		this.deg = 0;
		this.deg_jump = 1;
	}

	change_score(ds) {
		this.scores[this.score_pos].score += ds;
		
		var val = this.scores[this.score_pos].score;
		var score_pos = this.score_pos;
		var val = this.scores[score_pos];
		for (var i=score_pos - 1; i>=0; i--) {
			if (this.scores[i].score < val.score) {
				this.scores[this.score_pos] = this.scores[i];
				this.score_pos -= 1;
			}
			else {
				break;
			}
		}
		this.scores[this.score_pos] = val;
		
		var tbody = document.getElementsByTagName('tbody')[0];
		var trs = this.scores.slice(0, 5);
		tbody.innerHTML = '<tr><td>Name</td><td>Score</td></tr>';
		for (var tr=0; tr<trs.length; tr++)
			tbody.appendChild(this.make_score(trs[tr]));

		if (val % 5 == 0 && val > 0) {
			this.speed += 1;
			clearInterval(this.painting);
			clearInterval(this.painter.hurdle_factory);
			this.ongoing = false;
			this.start();
		}
	}
	make_score(el) {
		var tr = document.createElement('tr');
		var td = document.createElement('td');
		td.textContent = el.name;
		tr.appendChild(td);
		var td = document.createElement('td');
		td.textContent = el.score;
		tr.appendChild(td);
		
		return tr;
	}
	move(evt) {
		var self = this;
		if (evt.type != 'keydown' && evt.type != 'keyup'){
			if (evt.type == 'touchstart') {
				var dir = evt.touches[0].clientX < window.vw / 2 ? -1 : 1
				try {clearInterval(this.touch);}
				catch{}
				this.touch = setInterval(function() {
					self.slide(dir);
					self.wBall.rotate();
					self.bBall.rotate();
				}, 5);
			}
			else {
				try {clearInterval(this.touch);}
				catch{}
			}
		}
		else {
			if (evt.type == 'keydown') {
				if (evt.keyCode != 37 && evt.keyCode != 39)
					return;
				if (!this.kd) {
					this.kd = true;
					if (evt.keyCode == 37)
						var dir = -1;
					else if (evt.keyCode == 39)
						var dir = 1;
					this.mouse = setInterval(function() {
						self.slide(dir);
						self.wBall.rotate();
						self.bBall.rotate();
					}, 5);
				}
			}
			else {
				this.kd = false;
				try {clearInterval(this.mouse);}
				catch{}
			}
		}
	}
	slide(dir) {
		this.deg += (dir * this.deg_jump);
		if (this.deg < 0)
			this.deg = 360;
		else if (this.deg > 360)
			this.deg = 0;
	}
	draw() {
		this.painter = new Painter(this);
		this.painter.draw();
	}
	start() {
		var self = this;
		if (this.ongoing)
			return;
		this.ongoing = true;
		this.painter.create_hurdles();
		this.painter.create_powerups();
		this.painting = setInterval(function() {
			self.painter.draw();
		}, 20 - this.speed);
	}
	stop() {
		this.ongoing = false;
		clearInterval(this.painter.hurdle_factory);
		clearInterval(this.painting);
		try{clearInterval(this.touch);}
		catch{}
		try{clearInterval(this.mouse);}
		catch{}
		if (this.game_over) {
			this.canvas.style.display = 'none';
			var sure = confirm('Do you want to restart?');
			if (sure) {
				this.init();
				this.draw();
				this.start();
			}
			else
				toggle_state(0);
		}
		return;
	}
	resume() {
		var self = this;
		if (this.game_over) {
			this.init();
			this.draw();
			this.start();
		}
		else if (!this.ongoing) {
			setTimeout(function() {
				pause.innerHTML = 'Pause';
				self.start();
			}, 3000);
			pause.innerHTML = 'Restart in 3s'
			setTimeout(function() {
				pause.innerHTML = 'Restart in 2s'
			}, 1000);
			setTimeout(function() {
				pause.innerHTML = 'Restart in 1s'
			}, 2000);
		}
	}

}

/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*----------------------------------------------           Helper functions        ------------------------------------------------ */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
function to_rad(i) {
	return i * Math.PI / 180;
}

function sin(i) {
	return Math.sin(to_rad(i));
}

function cos(i) {
	return Math.cos(to_rad(i));
}

/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------          Main game initialised        ---------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */

var pause = document.getElementById('pause');
pause.addEventListener('click', toggle_state);
var show = document.getElementById('show');
show.addEventListener('click', toggle_score);
var score_board = document.getElementById('score-board');
var info = document.getElementById('info');

function toggle_state(evt) {
	if (evt == 0) {
		pause.innerHTML = 'Restart';
		info.style.color = 'black';
		return;
	}
	if (game.ongoing) {
		game.stop();
		pause.innerHTML = 'Resume';
	}
	else {
		game.resume();
	}
}

function toggle_score() {
	if (score_board.style.left == '-1000px') {
		show.style.top = 25 + score_board.offsetHeight + 'px';
		show.innerHTML = 'Hide';
		score_board.style.left = '20px';
		info.style.top = 90 + score_board.offsetHeight + 'px';
	}
	else {
		show.style.top = '20px';
		score_board.style.left = '-1000px';
		show.innerHTML = 'Show';
		info.style.top = '85px';
	}
}

var game = new Game();
game.draw();
game.start();
