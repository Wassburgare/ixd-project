/* Connect to backend */
const socket = new WebSocket(`ws://${window.location.hostname}:8081`);

/* Accordion effect for queued list of users */
var queueHeadings = document.getElementsByClassName('queue-header');
if (queueHeadings.length == 1) {
	var queueHeader = queueHeadings[0];
	queueHeader.addEventListener('click', function () {
		var classNames = this.parentNode.className;
		if (classNames.includes('open')) {
			this.parentNode.classList.remove('open');
			this.parentNode.classList.add('close');
		} else {
			this.parentNode.classList.remove('close');
			this.parentNode.classList.add('open');
		}
	});
}

/* Modal for creating character and joining queue */
var modalTrigger = document.getElementById('queue');
modalTrigger.addEventListener('click', function () {
	var modal = document.getElementById('joinModal');
	modal.classList.add('open');
})

var modalCloses = document.getElementsByClassName('modalClose');
for (var i = 0; i < modalCloses.length; i++) {
	var closeButton = modalCloses[i].addEventListener('click', function () {
		var modal = document.getElementById('joinModal');
		modal.classList.remove('open');
	})
}

/* Set up carousel */
var carousels = document.getElementsByClassName('carouselContent');
for (var i = 0; i < carousels.length; i++) {
	var carousel = carousels[i];
	var slides = carousel.getElementsByClassName('carouselSlide');
	for (var j = 0; j < slides.length; j++) {
		slides[j].setAttribute('data-value', j);
	}
	var moveOffset = parseInt(window.getComputedStyle(carousel.parentNode).width, 10);
	carousel.style.width = (moveOffset * slides.length) + 'px';

	// TODO click avoidance

	/* Add last item to start */
	carousel.insertBefore(slides[slides.length - 1], slides[0]);
}

var carouselLefts = document.getElementsByClassName('carouselLeft');
for (var i = 0; i < carouselLefts.length; i++) {
	var leftButton = carouselLefts[i];
	leftButton.addEventListener('click', function () {
		slideLeft(this);
	});
}

var carouselRights = document.getElementsByClassName('carouselRight');
for (var i = 0; i < carouselRights.length; i++) {
	var rightButton = carouselRights[i];
	rightButton.addEventListener('click', function () {
		slideRight(this);
	});
}

const keys = document.getElementsByClassName('key');
for (var i = 0; i < keys.length; i++) {
	const key = keys[i];
	key.addEventListener('click', () => {
		playKey(key.textContent);
	});
}

function slideLeft(button) {
	var carousel = button.parentNode.getElementsByClassName('carouselContent')[0];
	var dataTarget = carousel.parentNode.getAttribute('data-target');
	var moveOffset = parseInt(window.getComputedStyle(carousel.parentNode).width, 10);
	var slides = carousel.getElementsByClassName('carouselSlide');
	var index = slides[1].getAttribute('data-value');
	index--;
	if (index < 0) {
		index = slides.length - 1;
	}
	carousel.insertBefore(slides[slides.length-1], slides[0]);
	document.getElementById(dataTarget).value = index;
}

function slideRight(button) {
	var carousel = button.parentNode.getElementsByClassName('carouselContent')[0];
	var dataTarget = carousel.parentNode.getAttribute('data-target');
	var moveOffset = parseInt(window.getComputedStyle(carousel.parentNode).width, 10);
	var slides = carousel.getElementsByClassName('carouselSlide');
	var index = slides[1].getAttribute('data-value');
	index++;
	if (index > slides.length - 1) {
		index = 0;
	}
	carousel.insertBefore(slides[0], slides[slides.length-1].nextSibling)
	document.getElementById(dataTarget).value = index;
}

function joinQueue(e) {
	console.log(e);
	sendMessage({
		type: 'join_queue',
		user: {},
	});
}

function playKey(key) {
	console.log(e);
	sendMessage({
		type: 'play_key',
		key,
	});
}

function sendMessage(message) {
	if (socket.readyState === WebSocket.OPEN) {
		socket.send(JSON.stringify(message));
	}
}
