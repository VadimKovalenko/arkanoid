//Создание объекта Game() и остальных переменных по шаблону единой инструкции var
var game = new Game(),
//Инициализация массива с кирпичами
brick_arr = [],
//Создание переменной, в которой хранится число полученных очков
score = document.getElementById("score"),
current_score = 0,
mainDiv = document.getElementById("main-wrapper"),
startTitle = document.getElementById("start-title"),
startGame = 0;


function Load() {
	startTitle.innerHTML = "Click here to Start the game";
	mainDiv.onclick = function() {
		if(startGame == 0 && game.init()) {
			startGame = 1;
			mainDiv.style.background="transparent";
			startTitle.style.visibility="hidden";
			game.start();
			game.background.draw();//Вставляем бекграунд 1 раз
			//При первой перезагрузке страницы отрисовываем массив кирпичей
			addBricks();
		}
	}
}

//Генерируем случайное кол-во кирпичиков при первой загрузке страницы
createMap ();

//Функция для создания произвольного числа кирпичей
function createMap () {
	map = [];
	var cell;
	solid_cell = [];//перемнная для хранения кол-ва кирпичиков 
	for (i=0; i<75; ++i) {
		cell = Math.floor(Math.random() * 10);
		if (cell > 3) {
			map.push(1);
			solid_cell.push(1);
		}else if (cell <=3){
			map.push(0);
		}
	}
	return map;
}

//Функция проверки пересечения прямоугольныx объектов
function collision(a, b) {
    if (a.x + a.width > b.x && a.x < b.x + b.width && a.y + a.height > b.y && a.y < b.y + b.height) {
        return true;
    }
    else {
        return false;
    }
}

//Создание объекта (синглтона) для инициализации изображений
var imageRepository = new function() {
	// Создаем объекты Image() для хранения изображений
	this.background = new Image();
	this.playerbat = new Image();
	this.ball = new Image();
	// Проверяем или все изображения загрузились перед началом игры
	var numImages = 3;
	var numLoaded = 0;
	function imageLoaded() {
		numLoaded++;
		if (numLoaded === numImages) {
			window.Load();
		}
	}
	this.background.onload = function() {
		imageLoaded();
	}
	this.playerbat.onload = function() {
		imageLoaded();
	}
	this.ball.onload = function() {
		imageLoaded();
	}	
	//Задаем путь к изображениям
	this.background.src = "imgs/bg-2.png";
	this.playerbat.src = "imgs/bat3.png";
	this.ball.src = "imgs/ping-ball-small.png";
}
/**
	Создание класс Drawable(), который будет выступать базовым классом
	для всех отрисовывающихся объектов в игре. Задаем значения по умолчанию
	которые будут унаследоваться всеми дочерними элементами. Это абстрактный класс
 */
function Drawable() {
	this.initDraw = function(x, y, width, height) {
		//Значения по умолчанию
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
	
	this.speed = 0;
	this.canvasWidth = 0;
	this.canvasHeight = 0;
}
/*
	Создаем класс Background(), который будет являтся дочерним элементом
	по отношению к классу Drawable().
 */
function Background() {
	this.draw = function() {
		// Pan background
		this.context.drawImage(imageRepository.background, this.x, this.y);
	};
}
/*
	Создаем класс ракетки игрока Bat(). Используем технику "dirty rectangles"
	для отрисовки.
 */
function Bat() {
	this.speed = 4;
	var counter = 0;
	this.alive = true;
	this.draw = function() {
		this.context.drawImage(imageRepository.playerbat, this.x, this.y);
	};
	this.move = function() {
		counter++;
		//Определяем события движения
		if (KEY_STATUS.left || KEY_STATUS.right) {
			// При перемещении очищаем предыдущий прямоугольник
			this.context.clearRect(this.x, this.y, this.width, this.height);
			
			//Просчитываем  новые координаты в завитсимости от направления движения
			if (KEY_STATUS.left) {
				this.x -= this.speed
				if (this.x <= 0) //Держим игрока в границах экрана
					this.x = 0;
			} else if (KEY_STATUS.right) {
				this.x += this.speed
				if (this.x >= this.canvasWidth - this.width)
					this.x = this.canvasWidth - this.width;
			}			
			// Проверка или игрок не проиграл иначе не отрисовываем ракетку
			if (this.alive == true) {
				this.draw();
			}
		}
	};
}

//Создание класса Ball()
function Ball() {
	this.speedX = 3;
	this.speedY = 6;
	this.bat = new Bat(200, 500);
	var counter = 0;
	this.draw = function() {
		this.context.drawImage(imageRepository.ball, this.x, this.y);
	};
	this.move = function() {
		counter++;
		this.context.clearRect(this.x, this.y, this.width, this.height);
		// Столкновение с правой и левой стеной
		if (this.x < 0 || this.x > imageRepository.background.width - this.width) {
			this.speedX = -this.speedX;
		}
		// Соприкосновение с полом и потолком игрового поля
		if (this.y < 0 || this.y > imageRepository.background.height - this.height) {
			this.speedY = -this.speedY;
		}
		this.x += this.speedX;
		this.y -= this.speedY;
		//Перерисовываем мяч согласно новым координатам
		if (game.bat.alive == true) {
			this.draw();
		} else {
			gameOver();
		}
	}
}

function Brick(x, y, color) {
	this.x = x;
	this.y = y;
	this.width = 30;
	this.height = 30;
	this.color = "white";
}
// Метод стирает прямоугольник согласно заданным параметрам
Brick.prototype.clearRectangle = function(context) {
	context.clearRect(this.x, this.y, this.width, this.height);
}
// Метод рисует прямоугольник согласно заданным параметрам
Brick.prototype.draw= function(context, color) {
		context.rect(this.x, this.y, this.width, this.height, this.color);
}

function addBricks() {
	//Второй раз генерируем случайное кол-во кирпичиков, чтобы не перезагружая страницу после победы или поражения
	createMap ();
	brickCanvas = document.getElementById('bricks');
	brickContext = brickCanvas.getContext('2d');
	brickContext.globalAlpha = 0.5;
	x = 2; y = 2;
	for (i=1; i<=map.length; ++i) {
		brick = new Brick(x, y);
		brick_arr.push(brick);
		brick_arr[i-1].draw(brickContext);
		x +=  32;
		if(i % 15 === 0) {
				x = 2;
				y += 32;
		}
	}
	brickContext.fillStyle = brick.color;
	brickContext.fill();
	//Удаляем кирпичи согласно переменной randomize
	for (j=map.length; j>=0; j--) {
		if (map[j] == 0) {
			brick_arr[j].clearRectangle(brickContext);
			brick_arr.splice(j, 1);
		}
	}
}

 //Создание класса Game(), который хранит все объекты и данные для игры
function Game() {
	//Получение информации о канвасе и установка игровых объектов
	this.init = function() {
		//(прим.) В этой функции отсутствует цикл!
		//Получение информации о канвасе и установка игровых объектов
		this.bgCanvas = document.getElementById('background');
		this.batCanvas = document.getElementById('bat');
		this.mainCanvas = document.getElementById('main');
		
		// Проверяем или браузер поддерживает canvas
		if (this.bgCanvas.getContext) {
			this.bgContext = this.bgCanvas.getContext('2d');
			this.batContext = this.batCanvas.getContext('2d');
			this.mainContext = this.mainCanvas.getContext('2d');
		
			//Инициализация объектов для хранения информации о канвасе и контексте
			//Задаем Background/Bat/Ball наследование свойств из класса Drawable()
			Background.prototype = new Drawable();
			Bat.prototype = new Drawable();
			Ball.prototype = new Drawable();
			
			Background.prototype.context = this.bgContext;
			Background.prototype.canvasWidth = this.bgCanvas.width;
			Background.prototype.canvasHeight = this.bgCanvas.height;
			
			Bat.prototype.context = this.batContext;
			Bat.prototype.canvasWidth = this.batCanvas.width;
			Bat.prototype.canvasHeight = this.batCanvas.height;
			
			Ball.prototype.context = this.mainContext;
			Ball.prototype.canvasWidth = this.mainCanvas.width;
			Ball.prototype.canvasHeight = this.mainCanvas.height;
			
			//Инициализируем объект заднего фона
			this.background = new Background();
			this.background.initDraw(0,0);
			
			//Инициализируем объект ракетки игрока
			this.bat = new Bat();
			//Устанавливаем ракетку по центру
			batStartX = this.batCanvas.width/2 - imageRepository.playerbat.width/2;
			batStartY = this.batCanvas.height - imageRepository.playerbat.height;
			this.bat.initDraw(batStartX, batStartY, imageRepository.playerbat.width, imageRepository.playerbat.height);
			
			//Инициализируем объект мячика
			this.ball = new Ball();
			//Устанавливаем мяч по центру немного выше ракетки
			ballStartX = this.mainCanvas.width/2 - imageRepository.ball.width/2;
			ballStartY = this.mainCanvas.height - imageRepository.ball.height - 50;
			this.ball.initDraw(ballStartX, ballStartY, imageRepository.ball.width, imageRepository.ball.height);
				return true;
			} else {
				return false;
			}
	};
	//Начинаем анимационный цикл
		this.start = function() {
			if (this.bat.alive == true) {
				this.bat.draw();
				this.ball.draw();
				animate();
			} else {
				gameOver();
			}
		};	
	}
/**
 * The animation loop. Calls the requestAnimationFrame shim to
 * optimize the game loop and draws all game objects. This
 * function must be a gobal function and cannot be within an
 * object.
 */
function animate() {
	if (game.bat.alive) {
	if (current_score < solid_cell.length) {
		requestAnimFrame( animate );
		game.bat.move();
		game.ball.move();
			//Столкновение с ракеткой
			if (collision(game.bat, game.ball)) {
				//Столкновение с левой стороной ракетки
				if (game.ball.x < (game.bat.width/2 + game.bat.x)) {
					if (game.ball.speedX + Math.abs(game.ball.speedX) !== 0) {
						game.ball.speedX = -game.ball.speedX;
					}
				} else {
					if (game.ball.speedX + Math.abs(game.ball.speedX) === 0) {
						game.ball.speedX = -game.ball.speedX;
					}
				}
				game.ball.speedY = -game.ball.speedY;				
			}
			//Столкновение с кирпичами
			for(i=0; i<brick_arr.length; i++) {	
					if (collision(brick_arr[i], game.ball)) {
						game.ball.speedY = -game.ball.speedY;
						//Удаление кирпича
						brick_arr[i].clearRectangle(brickContext);
						brick_arr.splice(i, 1);
						current_score++;
					}
					//Добавление кол-ва очков в DOM
					score.innerHTML = current_score;;
				}		
	}
	//Обработка условия поражения
	//(Мяч соприкасается с полом)
	if (game.ball.y >= (imageRepository.background.height - imageRepository.ball.height)){
		game.bat.alive = false;
		gameOver();
		mainDiv.style.background="#1e2d3c";//синий цветет
		startTitle.innerHTML="You lose...Click here to try again.";
	} 
	//Обработка условия победы
	if (current_score == solid_cell.length){
			game.bat.alive = false;
			gameOver();
			mainDiv.style.background="#f57b2a";//Оранжевый цвет
			startTitle.innerHTML="You win! Play again?";
		}
	}
}

//Функция окончания игры
function gameOver() {
		//Сбрасываем счетчик очков
		current_score = 0;
		startGame = 0;
		startTitle.style.visibility="visible";
		//Очищаем неразбитые кирпичи
		for(i=0; i<brick_arr.length; i++) {
			brick_arr[i].clearRectangle(brickContext);
		}
		brick_arr = [];
		//Очищаем предыдущую позицию ракетки
		game.batContext.clearRect(game.bat.x, game.bat.y, imageRepository.playerbat.width, imageRepository.playerbat.height);
		//Очищаем предыдущую позицию шарика
		game.mainContext.clearRect(game.ball.x, game.ball.y, imageRepository.ball.width, imageRepository.ball.height);
		//Ракетка отрисовывается только при инициализации счетчика
		if (current_score) {
			//Заново кстанавливаем мяч и ракетку по центру
			game.bat.x = batStartX;
			game.bat.y = batStartY;
			game.ball.x = ballStartX;
			game.ball.y = ballStartY;
			//Отрисовываем ракетку в начальном положении
			game.bat.draw();
		}
}

// The keycodes that will be mapped when a user presses a button.
// Original code by Doug McInnes
KEY_CODES = {
  37: 'left',
  39: 'right',
}

// Creates the array to hold the KEY_CODES and sets all their values
// to false. Checking true/flase is the quickest way to check status
// of a key press and which one was pressed when determining
// when to move and which direction.
KEY_STATUS = {};
for (code in KEY_CODES) {
  KEY_STATUS[KEY_CODES[code]] = false;
}
/**
 * Sets up the document to listen to onkeydown events (fired when
 * any key on the keyboard is pressed down). When a key is pressed,
 * it sets the appropriate direction to true to let us know which
 * key it was.
 */
document.onkeydown = function(e) {
  // Firefox and opera use charCode instead of keyCode to
  // return which key was pressed.
  var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
  if (KEY_CODES[keyCode]) {
	e.preventDefault();
	KEY_STATUS[KEY_CODES[keyCode]] = true;
  }
}
/**
 * Sets up the document to listen to ownkeyup events (fired when
 * any key on the keyboard is released). When a key is released,
 * it sets teh appropriate direction to false to let us know which
 * key it was.
 */
document.onkeyup = function(e) {
  var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
  if (KEY_CODES[keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[keyCode]] = false;
  }
}
/**	
 * requestAnim shim layer by Paul Irish
 * Finds the first API that works to optimize the animation loop, 
 * otherwise defaults to setTimeout().
 */
window.requestAnimFrame =(function(){
	return  window.requestAnimationFrame       || 
			window.webkitRequestAnimationFrame || 
			window.mozRequestAnimationFrame    || 
			window.oRequestAnimationFrame      || 
			window.msRequestAnimationFrame     || 
			function(/* function */ callback, /* DOMElement */ element){
				window.setTimeout(callback, 1000 / 60);
			}
})();