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
		var name = prompt('Enter name: ');
		self.canvas.style.display = 'block';
		self.scores.push(new Score(name));
		this.change_score(0);

		
		self.ongoing = false;
		self.game_over = false;
		self.speed = 0;
		
		body = document.getElementsByTagName('body')[0];
		body.addEventListener('keydown', self.move);
		body.addEventListener('keyup', self.move);
		body.addEventListener('touchstart', self.move);
		body.addEventListener('touchend', self.move);
		
		deg = 0;
		self.deg_jump = 1;
		
		orbit = new Circle(0.5 * vw, vh - 150, 100, 0, '31bbfc');
		wBall = new Circle(orbit.cx - orbit.rad, orbit.cy, 20, 180, 'ffffff', 'white ball');
		bBall = new Circle(orbit.cx + orbit.rad, orbit.cy, 20, 0, '000000', 'black ball');
		hurdles = [];
		painting = 0;
		kd = false;
	}
	this.change_score = function(ds) {
		self.scores[self.score_pos].score += ds;
		var val = self.scores[self.score_pos].score;
		add_score();
		if (val % 8 == 0 && val > 0) {
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
	var add_score = function() {
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
		
		draw_score();
	}
	var draw_score = function() {
		var tbody = document.getElementsByTagName('tbody')[0];
		var trs = self.scores.slice(0, 5);
		tbody.innerHTML = '<tr><td>Name</td><td>Score</td></tr>';
		for (var tr=0; tr<trs.length; tr++)
			tbody.appendChild(make_score(trs[tr]));
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
				start = setInterval(function() {
					func();
					wBall.rotate();
					bBall.rotate();
				}, 5);
			}
			else if (evt.type == 'touchend') {
				clearInterval(start);
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
					start = setInterval(function() {
						func();
						wBall.rotate();
						bBall.rotate();
					}, 5);
				}
			}
			else {
				kd = false;
				try {clearInterval(start);}
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
		painting = setInterval(function() {
			self.painter.draw();
		}, 20 - self.speed);
	}
	this.stop = function() {
		this.ongoing = false;
		clearInterval(hurdle_factory);
		clearInterval(painting);
		try{clearInterval(start);}
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
				toggle(0);
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
			self.start();
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
		var rect = new Path2D();
		ctx.fillStyle = el.color;
		rect.rect(el.x, el.y, el.width, el.height);
		ctx.fill(rect);
	}

	var stroke_circle = function(el) {
		var circle = new Path2D();
		ctx.strokeStyle = el.color;
		circle.arc(el.cx, el.cy, el.rad, 0, 2*Math.PI);
		ctx.stroke(circle);
	}

	var fill_circle = function(el) {
		var circle = new Path2D();
		ctx.fillStyle = el.color;
		circle.arc(el.cx, el.cy, el.rad, 0, 2*Math.PI);
		ctx.fill(circle);
	}

	this.draw = function() {
		ctx.clearRect(0, 0, vw, vh);
		ctx.fillStyle = '#965784';
		ctx.fillRect(0, 0, vw, vh);
		stroke_circle(orbit);
		fill_circle(wBall);
		fill_circle(bBall);
		for (var i=0; i<hurdles.length; i++) {
			fill_rect(hurdles[i]);
			hurdles[i].move();
		}
	}

	this.create_hurdles = function() {
		hurdle_factory = setInterval(function() {
			var x = Math.random() * 200;
			var width = 80 + Math.random() * 40;
			hurdles.push(new Hurdle(x, width, '1c3a56', vw, vh));
		}, 1000 - game.speed * 200);
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
var Circle = function(cx, cy, rad, offset, color, name) {
	var self = this;
	this.cx = cx;
	this.cy = cy;
	this.rad = rad;
	this.color = '#' + color;
	this.name = name || 'Noname';
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
					console.log('Collision with ' + balls[i].name);
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

var game = new Game();
game.init();
game.draw();
game.start();

var pause = document.getElementById('pause');
pause.addEventListener('click', toggle);

function toggle(evt) {
	if (evt == 0) {
		pause.innerHTML = 'Restart';
		return;
	}
	if (game.ongoing) {
		game.stop();
		pause.innerHTML = 'Resume';
	}
	else {
		console.log('Caliing from 2');
		game.resume();
		pause.innerHTML = 'Pause';
	}
}