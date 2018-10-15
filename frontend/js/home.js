/* Connect to backend */
const socket = new WebSocket(`ws://${window.location.hostname}:8081`);

socket.onmessage = (message) => {
	var parsedMessage = JSON.parse(message.data);
	switch (parsedMessage.type) {
		case 'queue_updated':
			updateQueue(parsedMessage.data);
			break;
		case 'key_played':
			updateKeyPlayed(parsedMessage.data);
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

var CURRENT_USER = {};
var CURRENT_PLAYER_ID = "";
var CURRENT_TIME_LEFT = undefined;
var CURRENT_TIMER = null;

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

var quitPlayingButton = document.getElementById('quitPlaying');
quitPlayingButton.addEventListener('click', function () {
	leaveQueue(CURRENT_USER);
});

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
		playKey(key.id);
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
	var currentPlayer = null;
	if (queuedPlayers.length > 0) {
		currentPlayer = queuedPlayers[0];
	}
	// var currentPlayer = queuedPlayers.shift();
	updateCurrentUserItem(currentPlayer);
	var inQueue = updateQueueContent(queuedPlayers);
	updateControls(inQueue);
	updateEstimatedWait(queuedPlayers.length);
}

function updateCurrentUserItem(user) {
	var currentPlayerEl = document.getElementsByClassName('current-player')[0];
	var avatarEl = currentPlayerEl.getElementsByClassName('avatar')[0];
	var headings = currentPlayerEl.getElementsByTagName('H6');
	currentPlayerEl.classList.remove('self-user');
	if (user) {
		CURRENT_PLAYER_ID = user.id;
		createAvatar(avatarEl, user.eyes, user.mouth);
		clearInterval(CURRENT_TIMER);
		if (user.timeLeft !== undefined) {
			CURRENT_TIME_LEFT = user.timeLeft - 500;
			CURRENT_TIMER = setInterval(setTime, 1000);
		} else {
			CURRENT_TIME_LEFT = user.timeLeft;
			clearInterval(CURRENT_TIMER);
		}
		headings[1].innerHTML = '<span class="waittime">' + timeToLabel(CURRENT_TIME_LEFT) + '</span> until turn runs out';
		if (user.id === CURRENT_USER.id) {
			currentPlayerEl.classList.add('self-user');
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

function updateControls(inQueue) {
	var controls = document.getElementsByClassName('controls')[0];
	var quitButton = document.getElementById('quitPlaying');
	var playButton = document.getElementById('playXylophone');

	if (CURRENT_PLAYER_ID === CURRENT_USER.id) {
		controls.classList.remove('disabled');
		hidePlayButton();
		showQuitButton(false);
	} else {
		controls.classList.add('disabled');
		if (inQueue) {
			hidePlayButton();
			showQuitButton(inQueue);
		} else {
			// Not yet in queue
			showPlayButton();
			hideQuitButton();
		}
	}

	function showPlayButton() {
		playButton.style.padding = '8px 15px';
		playButton.style.height = 'auto'
	}

	function hidePlayButton() {
		playButton.style.padding = '0';
		playButton.style.height = '0px';
	}

	function showQuitButton(inQueue) {
		quitButton.style.padding = '8px 15px';
		quitButton.style.height = 'auto';

		if (inQueue) {
			quitButton.innerHTML = "Leave queue to play";
		} else {
			quitButton.innerHTML = 'Quit playing';
		}
	}

	function hideQuitButton() {
		quitButton.style.padding = '0';
		quitButton.style.height = '0px';
	}
}

function updateQueueContent(queuedPlayers) {
	var playersAhead = 0;
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
		createAvatar(avatarContainer, player.eyes, player.mouth);
		// avatarContainer.innerHTML = player.eyes + ', ' + player.mouth;
		queuedPlayerName.innerHTML = player.nickname;
		queuedPlayerEl.appendChild(avatarContainer);
		queuedPlayerEl.appendChild(queuedPlayerName);
		listNode.appendChild(queuedPlayerEl);

		if (!foundSelf && (player.id !== CURRENT_USER.id)) {
			playersAhead++;
		} else if (!foundSelf && (player.id === CURRENT_USER.id)) {
			foundSelf = true;
			queuedPlayerEl.classList.add('self-user')
		}
	});

	// Set up queue header
	var waitingEl = document.getElementsByClassName('waiting-players')[0];
	var followText = "";
	if (CURRENT_PLAYER_ID === CURRENT_USER.id) {
		followText = queuedPlayers.length-1 === 1 ? ' player after you' : ' players after you';
		waitingEl.innerHTML = queuedPlayers.length-1 + followText;
	} else {
		followText = playersAhead === 1 ? ' player before you' : ' players before you';
		waitingEl.innerHTML = playersAhead + followText;
	}

	// Return whether or not current player was found in the queue
	return foundSelf;
}

function createAvatar(container, eyes, mouth) {
	container.innerHTML = "";
	const eyesSource = '/img/Eyes-' + eyes + '.svg';
	const mouthSource = '/img/Mouth-' + mouth + '.svg';
	var eyesEl = document.createElement('IMG');
	eyesEl.src = eyesSource;
	var mouthEl = document.createElement('IMG');
	mouthEl.src = mouthSource;
	container.appendChild(eyesEl);
	container.appendChild(mouthEl); 
}

function updateEstimatedWait(numQueuedPlayers) {
	var waitTime = 0;
	waitTime += 2 * numQueuedPlayers;
	var waitTimeEl = document.getElementById('waittime');
	if ( waitTime == 0) {
		// No one is currently playing
		waitTimeEl.innerHTML = "Estimated wait: none";
	} else {
		waitTimeEl.innerHTML = "Estimated wait: " + waitTime + " min";
	}
}

function updateKeyPlayed(key) {
	if (CURRENT_PLAYER_ID === CURRENT_USER.id) {
		// Do not show for current player
		return;
	}

	var keyPlayed = document.getElementById(key);
	keyPlayed.classList.add('played');
	setTimeout(function () {
		keyPlayed.classList.remove('played');
	}, 1000);
}

/* Socket functions send */
function joinQueue(user) {
	sendMessage({
		type: 'join_queue',
		user: user
	});
}

function leaveQueue(user) {
	sendMessage({
		type: 'leave_queue'
	});
}

// Pass key as key button id on DOM
function playKey(key) {
	sendMessage({
		type: 'play_key',
		key: key,
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

/*
	timeMs is the time remaining in the turn in milliseconds
	returns time as a String
*/
function timeToLabel(timeMs) {
	if (timeMs !== undefined) {
		var x = Math.floor(timeMs / 1000);
		const seconds = Math.floor(x % 60);
		x /= 60;
		const minutes = Math.floor(x % 60);
		return minutes.pad() + ':' + seconds.pad();
	} else {
		return '---';
	}
}

function setTime() {
	if ((CURRENT_TIME_LEFT !== null) && (CURRENT_TIME_LEFT-1000 > 0)) {
		var waittimeEls = document.getElementsByClassName('waittime');
		for (var i = 0; i < waittimeEls.length; i++) {
			const waittimeEl = waittimeEls[i];
			CURRENT_TIME_LEFT -= 1000;
			waittimeEl.innerHTML = timeToLabel(CURRENT_TIME_LEFT);
		}
	} else {
		clearInterval(CURRENT_TIMER);
	}
}

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}
