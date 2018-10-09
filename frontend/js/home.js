/* Connect to backend */
const socket = new WebSocket(`ws://${window.location.hostname}:8081`);

socket.onmessage = (message) => {
	console.log(message);
	var parsedMessage = JSON.parse(message.data);
	switch (parsedMessage.type) {
		case 'queue_updated':
			// Do something
			updateQueue(parsedMessage.data);
			break;
	}
};

/* Connect to camera stream */
const webRtcServer = new WebRtcStreamer('video', `${location.protocol}//${window.location.hostname}:8989`);

window.onload = function() {
	webRtcServer.connect('', '', 'rtptransport=tcp&timeout=60');
};

window.onbeforeunload = function() {
	webRtcServer.disconnect();
};

var currentUser = {};
var CURRENT_USER = {};
var CURRENT_PLAYER_ID = "";

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
var modalTrigger = document.getElementById('playXylophone');
modalTrigger.addEventListener('click', function () {
	var modal = document.getElementById('joinModal');
	modal.classList.add('open');
})

var modalCloses = document.getElementsByClassName('modalClose');
for (var i = 0; i < modalCloses.length; i++) {
	var closeButton = modalCloses[i].addEventListener('click', function () {
		closeModal();
	})
}

function closeModal() {
	var modal = document.getElementById('joinModal');
	modal.classList.remove('open');
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

/* Form management*/
var form = document.getElementById('createAvatar');
form.addEventListener('submit', function(event) {
	return createUser(event);
});

function createUser(event) {
	closeModal();
	event.preventDefault();
	var eyesValue = document.getElementById('avatarEyes').value;
	var mouthValue = document.getElementById('avatarMouth').value;
	var nicknameValue = document.getElementById('avatarNickname').value;
	var user = {
		'eyes': eyesValue,
		'mouth': mouthValue,
		'nickname': nicknameValue,
		'id': uuid()
	}
	CURRENT_USER = user;
	joinQueue(user);
	return false;
}

function updateQueue(queuedPlayers) {
	var currentPlayer = queuedPlayers.shift();
	updateCurrentUserItem(currentPlayer);
	updateControls();
	updateQueueContent(queuedPlayers);
}

function updateCurrentUserItem(user) {
	var currentPlayerEl = document.getElementsByClassName('current-player')[0];
	var avatarEl = currentPlayerEl.getElementsByClassName('avatar')[0];
	var headings = currentPlayerEl.getElementsByTagName('H6');
	if (user) {
		CURRENT_PLAYER_ID = user.id;
		avatarEl.innerHTML = user.eyes + ', ' + user.mouth;
		headings[1].innerHTML = '02:00 until turn runs out';
		if (user.id === CURRENT_USER.id) {
			headings[0].innerHTML = 'You are currently playing'
		} else {
			headings[0].innerHTML = user.nickname + ' is currently playing';
		}
	} else {
		/* No one left in the queue to play */
		CURRENT_PLAYER_ID = "";
		avatarEl.innerHTML = ':)';
		headings[0].innerHTML = 'No one is currently playing';
		headings[1].innerHTML = '---';
	}
}

function updateControls() {
	var controls = document.getElementsByClassName('controls')[0];
	var quitButton = document.getElementById('quitPlaying');
	var playButton = document.getElementById('playXylophone');
	if (CURRENT_PLAYER_ID === CURRENT_USER.id) {
		controls.classList.remove('disabled');
		quitButton.style.padding = '8px 15px';
		quitButton.style.height = 'auto';
		playButton.style.padding = '0';
		playButton.style.height = '0px';
	} else {
		controls.classList.add('disabled');
		playButton.style.padding = '8px 15px';
		playButton.style.height = 'auto';
		quitButton.style.padding = '0';
		quitButton.style.height = '0px';
	}
}

function updateQueueContent(queuedPlayers) {
	var playersAhead = CURRENT_PLAYER_ID === "" ? 0 : 1;
	var foundSelf = false;

	var listNode = document.getElementsByClassName('queue-content')[0]
			.getElementsByTagName('UL')[0];
	// Clear out list in case of stale values
	while(listNode.firstChild) {
		listNode.removeChild(listNode.firstChild);
	}

	// Create content for queue
	queuedPlayers.forEach(function (player) {
		// Set values
		var queuedPlayerEl = document.createElement('li');
		var avatarContainer = document.createElement('div');
		var queuedPlayerName = document.createElement('h6');
		queuedPlayerEl.classList.add('queued-user');
		avatarContainer.classList.add('avatar');
		avatarContainer.innerHTML = player.eyes + ', ' + player.mouth;
		queuedPlayerName.innerHTML = player.nickname;
		queuedPlayerEl.appendChild(avatarContainer);
		queuedPlayerEl.appendChild(queuedPlayerName);
		listNode.appendChild(queuedPlayerEl);

		if (!foundSelf && (player.id !== CURRENT_USER.id)) {
			playersAhead++;
		} else if (!foundSelf && (player.id === CURRENT_USER.id)) {
			foundSelf = true;
		}
	});

	// Set up queue header
	var waitingEl = document.getElementsByClassName('waiting-players')[0];
	var followText = "";
	if (CURRENT_PLAYER_ID === CURRENT_USER.id) {
		followText = queuedPlayers.length === 1 ? ' player after you' : ' players after you';
		waitingEl.innerHTML = queuedPlayers.length + followText;
	} else {
		followText = playersAhead === 1 ? ' player before you' : ' players before you';
		waitingEl.innerHTML = playersAhead + followText;
	}
}

/* Socket functions send */
function joinQueue(user) {
	sendMessage({
		type: 'join_queue',
		user: user
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

/* Helper functions */
function uuid() {
    return crypto.getRandomValues(new Uint32Array(4)).join('-');
}
