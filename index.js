/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*----------------------------------------------           Game constructor        ------------------------------------------------ */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
var Game = function() {
	var self = this;
	var score = document.getElementById('score-board');
	this.scores = [];
	this.init = function() {
		vw = window.innerWidth;
		vh = window.innerHeight;

		self.canvas = document.getElementsByTagName('canvas')[0];
		self.ctx = self.canvas.getContext('2d');
		
		self.score_pos = self.scores.length;
		name = 'l';
		var name = prompt('Enter name: ');
		while (name == '' || name == null)
			var name = prompt('Enter name: ');
		self.canvas.style.display = 'block';
		self.scores.push(new Score(name));
		this.change_score(0);

		if (vw < 600) {
			score_board.style.left = '0px';
			toggle_score();
		}
		else {
			show.style.display = 'none';
			info.style.top = 30 + score_board.offsetHeight + 'px';
		}
		info.style.color = 'white';
		
		self.ongoing = false;
		self.game_over = false;
		self.speed = 0;
		
		body = document.getElementsByTagName('body')[0];
		body.addEventListener('keydown', self.move);
		body.addEventListener('keyup', self.move);
		body.addEventListener('touchstart', self.move);
		body.addEventListener('touchend', self.move);
		body.addEventListener('touchcancel', self.move);
		
		deg = 0;
		self.deg_jump = 1;
		
		orbit = new Circle(0.5 * vw, vh - 150, 100, 0, '31bbfc');
		wBall = new Circle(orbit.cx - orbit.rad, orbit.cy, 20, 180, 'ffffff');
		bBall = new Circle(orbit.cx + orbit.rad, orbit.cy, 20, 0, '000000');
		hurdles = [];
		powerups = [];
		powerup_names = ['horlicks', 'flight'];
		last_powerup = 0;
		painting = 0;
		kd = false;
	}
	this.change_score = function(ds) {
		self.scores[self.score_pos].score += ds;
		
		var val = self.scores[self.score_pos].score;
		var score_pos = self.score_pos;
		var val = self.scores[score_pos];
		for (var i=score_pos - 1; i>=0; i--) {
			if (self.scores[i].score < val.score) {
				self.scores[self.score_pos] = self.scores[i]; // [0]
				self.score_pos -= 1;
			}
			else {
				break;
			}
		}
		self.scores[self.score_pos] = val;
		
		var tbody = document.getElementsByTagName('tbody')[0];
		var trs = self.scores.slice(0, 5);
		tbody.innerHTML = '<tr><td>Name</td><td>Score</td></tr>';
		for (var tr=0; tr<trs.length; tr++)
			tbody.appendChild(make_score(trs[tr]));

		if (val % 5 == 0 && val > 0) {
			self.speed += 1;
			clearInterval(painting);
			clearInterval(hurdle_factory);
			self.ongoing = false;
			self.start();
		}
	}
	var make_score = function (el) {
		var tr = document.createElement('tr');
		var td = document.createElement('td');
		td.textContent = el.name;
		tr.appendChild(td);
		var td = document.createElement('td');
		td.textContent = el.score;
		tr.appendChild(td);
		
		return tr;
	}
	this.move_left = function() {
		deg -= self.deg_jump;
		if (deg < 0)
			deg = 360;
	}
	this.move_right = function() {
		deg += self.deg_jump;
		if (deg > 360)
			deg = 0;
	}
	this.move = function(evt) {
		if (evt.type != 'keydown' && evt.type != 'keyup'){
			if (evt.type == 'touchstart') {
				var func = evt.touches[0].clientX < vw / 2 ? self.move_left : self.move_right
				try {clearInterval(touch);}
				catch{}
				touch = setInterval(function() {
					func();
					wBall.rotate();
					bBall.rotate();
				}, 5);
			}
			else {
				try {clearInterval(touch);}
				catch{}
				clearInterval(touch);
			}
		}
		else {
			if (evt.type == 'keydown') {
				if (evt.keyCode != 37 && evt.keyCode != 39)
					return;
				if (!kd) {
					kd = true;
					if (evt.keyCode == 37)
						var func = self.move_left;
					else if (evt.keyCode == 39)
						var func = self.move_right;
					mouse = setInterval(function() {
						func();
						wBall.rotate();
						bBall.rotate();
					}, 5);
				}
			}
			else {
				kd = false;
				try {clearInterval(mouse);}
				catch{}
			}
		}
	}
	this.draw = function() {
		self.painter = new Painter(self.canvas, self.ctx);
		self.painter.draw();
	}
	this.start = function() {
		if (self.ongoing)
			return;
		this.ongoing = true;
		self.painter.create_hurdles();
		self.painter.create_powerups();
		painting = setInterval(function() {
			self.painter.draw();
		}, 20 - self.speed);
	}
	this.stop = function() {
		this.ongoing = false;
		clearInterval(hurdle_factory);
		clearInterval(painting);
		try{clearInterval(touch);}
		catch{}
		try{clearInterval(mouse);}
		catch{}
		if (self.game_over) {
			self.canvas.style.display = 'none';
			var sure = confirm('Do you want to restart?');
			if (sure) {
				self.init();
				self.draw();
				self.start();
			}
			else
				toggle_state(0);
		}
		return;
	}
	this.resume = function() {
		if (self.game_over) {
			self.init();
			self.draw();
			self.start();
		}
		else if (!self.ongoing) {
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
/*--------------------------------------------           Painter constructor        ----------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
var Painter = function(canvas, ctx) {
	var self = this;
	canvas.height = vh;
	canvas.width = vw;
	var fill_rect = function(el) {
		ctx.beginPath();
		ctx.rect(el.x, el.y, el.width, el.height);
		ctx.fillStyle = el.color;
		ctx.closePath();
		ctx.fill();
	}

	var stroke_circle = function(el) {
		ctx.beginPath();
		ctx.arc(el.cx, el.cy, el.rad, 0, 2*Math.PI);
		ctx.strokeStyle = el.color;
		ctx.closePath();
		ctx.stroke();
	}

	var fill_circle = function(el) {
		ctx.beginPath();
		ctx.arc(el.cx, el.cy, el.rad, 0, 2*Math.PI);
		ctx.fillStyle = el.color;
		ctx.closePath();
		ctx.fill();
	}

	this.draw = function() {
		ctx.clearRect(0, 0, vw, vh);
		ctx.beginPath();
		ctx.rect(0, 0, vw, vh);
		ctx.fillStyle = '#965784';
		ctx.fill();
		ctx.closePath();
		stroke_circle(orbit);
		fill_circle(wBall);
		fill_circle(bBall);
		for (var i=0; i<hurdles.length; i++) {
			ctx.beginPath();
			fill_rect(hurdles[i]);
			ctx.closePath();
			hurdles[i].move();
		}
		for (var i=0; i<powerups.length; i++) {
			ctx.beginPath();
			fill_circle(powerups[i]);
			ctx.closePath();
			powerups[i].move();
		}
	}

	this.create_hurdles = function() {
		hurdle_factory = setInterval(function() {
			var x = Math.random() * 200;
			var width = 80 + Math.random() * 40;
			hurdles.push(new Hurdle(x, width, '1c3a56', vw, vh));
		}, 1000 - game.speed * 200);
	}
	this.create_powerups = function() {
		powerup_factory = setInterval(function() {
			// last_powerup += 1;
			if (Math.random() < 0.05) {
				powerups.push(new PowerUp(powerup_names[Math.round(Math.random())]));
			}
		}, 1000);
	}
	this.clear = function() {
		ctx.clearRect(0, 0, vw, vh);
	}
}


/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*---------------------------------------------           Circle constructor        ----------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
var Circle = function(cx, cy, rad, offset, color) {
	var self = this;
	this.cx = cx;
	this.cy = cy;
	this.rad = rad;
	this.color = '#' + color;
	this.rotate = function() {
		self.cx = orbit.cx + orbit.rad * cos(offset + deg);
		self.cy = orbit.cy + orbit.rad * sin(offset + deg);
	}
}

/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*---------------------------------------------           Score constructor        ----------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
var Score = function(name) {
	this.name = name;
	this.score = 0;
}

/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------           Powerup constructor        ----------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
var PowerUp = function(name) {
	var self = this;
	this.cx = orbit.cx + (Math.random() - 0.5) * 2 * orbit.rad;
	this.cy = 0.1 * vh;
	this.rad = 20;
	var balls = [wBall, bBall];
	this.name = name;
	if (this.name == 'flight')
		this.color = 'yellow';
	else
		this.color = 'red';
	var dy = 0.01 * vh;

	this.move = function() {
		self.cy += dy;
		for (var i=0; i<2; i++) {
			if (self.check_y(balls[i])) {
				if (self.check_x(balls[i])) {
					if (self.name == 'flight')
						game.deg_jump = (game.deg_jump * 10 + 1) / 10;
					else
						balls[i].rad -= 1;

					self.remove();
					break;
				}
			}
		}
		if (self.cy > vh)
			self.remove();
	}

	this.check_y = function(ball) {
		var bar = ball.cy + ball.rad;
		return (self.cy - self.rad < bar && self.cy + self.rad > bar)
	}
	this.check_x = function(ball) {
		var bar = ball.cx - ball.rad;
		return ((self.cx - self.rad < bar && self.cx + self.rad > bar) || (self.cx - self.rad > bar && self.cx - self.rad < bar + 2 * ball.rad && self.cx + self.rad > bar))
	}
	this.remove = function() {
		powerups.splice(powerups.indexOf(self), 1);
	}

}

/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*---------------------------------------------           Hurdle constructor        ----------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
/*--------------------------------------------------------------------------------------------------------------------------------- */
var Hurdle = function(x, width, color) {
	this.x = x + 0.5 * vw - 150;
	this.y = 0.1 * vh;
	this.width = width;
	this.height = 30;
	this.color = '#' + color;
	var dy = 0.01 * vh;
	var self = this;
	var balls = [wBall, bBall];
	this.move = function() {
		self.y += dy;
		for (var i=0; i<2; i++) {
			if (self.check_y(balls[i])) {
				if (self.check_x(balls[i])) {
					game.game_over = true;
					game.stop();
					break;
				}
			}
		}
		if (self.y > vh)
			self.remove();
	}
	this.remove = function() {
		hurdles.splice(hurdles.indexOf(self), 1);
		game.change_score(1);
	}
	this.check_y = function(ball) {
		var bar = ball.cy + ball.rad;
		return (self.y < bar && self.y + self.height > bar)
	}
	this.check_x = function(ball) {
		var bar = ball.cx - ball.rad;
		return ((self.x < bar && self.x + self.width > bar) || (self.x > bar && self.x < bar + 2 * ball.rad && self.x + self.width > bar))
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
game.init();
game.draw();
game.start();