/**
 * Created by admin on 28-03-2018.
 */
var server_url="https://www.prodx.in/";
var fingerprint = new Fingerprint().get();

var chatCount = 0;
var current_height = $(".selekt-conversation-body-parts").prop("scrollHeight");
var device_id = fingerprint;
var hideoptions = {"direction": "left", "mode": "hide"};
var socket = io.connect(server_url, {'path': '/m-advisor-measure-socket'});
var visitorName = '';
var visitorEmail = '';
var visitorNumber = '';
var alreadyOnline = false;
var req = function () {
    $.ajax({
        url : server_url+"m-advisor-measure/get-online-status",
        success : function () {
                online();
            setTimeout(function () {
                req();
            }, 3000);
        },error: function(){
            offline();
            req();
        }
    });
};

req();


function offline(){
    alreadyOnline = false;
    console.log("Disconnected from INTERNET");
        document.getElementById('network_status').style.background = "#FF1744";
        document.getElementById('connection_msg').innerHTML = "NO INTERNET CONNECTION";
        document.getElementById('network_status').style.display = "block";
        document.getElementById('no-internet-screen').style.display = "block";
        document.getElementById('selekt-header-buttons-reset').style.display = "none"; 
        document.getElementById('scroll_div_chat').style.overflow= "hidden"; 
}
function online(){
    alreadyOnline = true;
    document.getElementById('network_status').style.background = "#00E676";
    document.getElementById('connection_msg').innerHTML = "CONNECTED";
    document.getElementById('no-internet-screen').style.display = "none";
    document.getElementById('selekt-header-buttons-reset').style.display = "block";
    document.getElementById('scroll_div_chat').style.overflow= "auto"; 
    setTimeout(function(){ document.getElementById('network_status').style.display = "none"; }, 2000); 
}

function showScreen() {
    if (localStorage.getItem("chat_history2") != null || localStorage.getItem("chat_history2") != undefined) {
        $('#landing-container').hide();
        $('.selekt-conversation-body-parts').show();
        $('.selekt-conversation-footer').show();
        $(localStorage.getItem("chat_history2")).appendTo($('.selekt-conversation-parts'));
        $('.selekt-conversation-body-parts').scrollTop($('.selekt-conversation-body-parts-wrapper').height());
        console.log($('.selekt-conversation-body-parts-wrapper').height());
        $('#selekt-header-buttons-reset').css('display', 'block');
    } else {
        // console.log("Chat content null : ", localStorage.getItem("chat_history2"));
        // $('#landing-container').show();
        // $('#visitor_name').val(localStorage.getItem('visitor_name'));
        // $('#visitor_email').val(localStorage.getItem('visitor_email'));
        // $('#visitor_number').val(localStorage.getItem('visitor_number'));
        // $('.selekt-conversation-body-parts').hide();
        // $('.selekt-conversation-footer').hide();
        // $('#selekt-header-buttons-reset').css('display', 'none');
        $('#landing-container').hide();
        $('.selekt-conversation-body-parts').show();
        $('.selekt-conversation-footer').show();
        var message = {
            device_id: device_id,
            user_name: visitorName,
            mail_id: visitorEmail,
            phone_number: visitorNumber
        };
        console.log("add user emit");
        socket.emit('add_user', JSON.stringify(message));
        // addTyping();
        $('#selekt-header-buttons-reset').css('display', 'block');
    }
}

showScreen();
/*$('#selekt-container').hide();
 $('#external-link-container').show();
 $('#external-link').attr("src", 'https://www.tatavaluehomes.com/wap/new-haven/mumbai-boisar/detail');*/
if (screen.width <= 480) {
    console.log("Is a mobile");
} else {
    console.log("Is a desktop");
}

var rememberMe = false;
$(document.body).on('click', '#remember_user', function () {
    if (this.checked) {
        rememberMe = true;
    }
});

$(document.body).on('click', '#get_started', function () {
    var visitorName = $('#visitor_name').val();
    var visitorEmail = $('#visitor_email').val();
    var visitorNumber = $('#visitor_number').val();
    var isValidName = /^[a-zA-Z ]+$/.test(visitorName);
    var isValidEmail = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/.test(visitorEmail);
    var isValidNumber = /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[789]\d{9}$/.test(visitorNumber);

    if (isValidName && isValidEmail && isValidNumber) {
        if (rememberMe) {
            localStorage.setItem("remember_me", true);
            localStorage.setItem("visitor_name", visitorName);
            localStorage.setItem("visitor_email", visitorEmail);
            localStorage.setItem("visitor_number", visitorNumber);
        }
        /*setCookie("session_id", session_id);*/
        $("#landing-container").effect("fade", hideoptions, 300, function () {
            $('.selekt-conversation-body-parts').show();
            $('.selekt-conversation-footer').show();
            var message = {
                device_id: device_id,
                user_name: visitorName,
                mail_id: visitorEmail,
                phone_number: visitorNumber
            };
            console.log("add user emit");
            socket.emit('add_user', JSON.stringify(message));
        });
        $('#selekt-header-buttons-reset').css('display', 'block');
    } else if (!isValidName && !isValidEmail && !isValidNumber) {
        $('#showNameError').text("All fields are necessary");
        $('#showNameError').show();
    } else if (!isValidEmail) {
        $('#showNameError').text("Enter valid email address");
        $('#showNameError').show();
    } else if (!isValidNumber) {
        $('#showNameError').text("Enter valid Mobile number");
        $('#showNameError').show();
    } else if (!isValidName) {
        $('#showNameError').text("Please enter your name");
        $('#showNameError').show();
    }
});

function detectmob() {
    return window.innerWidth <= 800 && window.innerHeight <= 600;
}

function setCookie(cname, cvalue) {
    var d = new Date();
    d.setTime(d.getTime() + (2 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

$("#visitor_name").keyup(function (event) {
    if (event.keyCode === 13) {
        $("#get_started").click();
    }
});
$(document.body).on('click', '#skip', function () {
    $("#landing-container").effect("fade", hideoptions, 300, function () {
        $('.selekt-conversation-body-parts').show();
        $('.selekt-conversation-footer').show();
        var message = {
            device_id: device_id,
            user_name: visitorName,
            mail_id: visitorEmail,
            phone_number: visitorNumber
        };
        console.log("add user emit");
        socket.emit('add_user', JSON.stringify(message));
        addTyping();
    });
    $('#selekt-header-buttons-reset').css('display', 'block');
});

$(document.body).on('click', '#close-external', function () {
    $('#external-link').attr("src", '#');
    $('#external-link-container').hide();
    $('#selekt-container').show();
});

$(document.body).on('input', '#visitor_name', function () {
    $('#showNameError').hide();
    $('#remember_user').prop("checked", false);
});
function getCookieValue(a) {
    var b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
    return b ? b.pop() : '';
}
function getCurrentURL(){
    var url = document.URL;
    return url;
}
socket.on('connect', function (data) {
    console.log("Connection");
    online();
    var msg = {
        device_id: device_id
    };
    socket.emit("hello", JSON.stringify(msg));

});

socket.on('reconnect', function (data) {
    console.log("reconnection");
    online();
    var message = {
        device_id: device_id,
        user_name: localStorage.getItem('visitor_name'),
        user_email: localStorage.getItem('visitor_email'),
        user_mobile: localStorage.getItem('visitor_number')
    };
    socket.emit('reconnected', JSON.stringify(message));
});

	socket.on('connect_error', function(data) {
	    console.log("Connection error!");
        offline();
	});

socket.on('chat', function (data) {
    console.log("Text message data : ", JSON.stringify(data));
    removeTyping();
    addTextMessage(data);
    if (data.gif_status === true) {
        addTyping();
    }
    if(data.disable_chat_status) {
        disableChat();
    }
    else {
        enableChat();
    }
    console.log("Scroll height: ", current_height);
});

socket.on('clear', function () {
    console.log("clear chat");
    $('.selekt-conversation-parts').empty();
    localStorage.removeItem("chat_history2");
    showScreen();
});

socket.on('expired', function () {
    console.log("session expired");
    if (localStorage.getItem("remember_me") == "false" || localStorage.getItem("remember_me") == null || localStorage.getItem("remember_me") == undefined) {
        localStorage.removeItem("visitor_name");
        localStorage.removeItem("visitor_email");
        localStorage.removeItem("visitor_number");
    }
    localStorage.removeItem("chat_history2");
    location.reload();
});

socket.on('disconnect', function (data) {
    console.log("session disconnected");
});

socket.on('carousel_subtitle', function (data) {
    console.log("Carousel with subtitle", data);
    removeTyping();
    addCarousalSubtitleText(data);
    if (data.gif_status === true) {
        addTyping();
    }
    updateScrollbar();
});

socket.on('bot_questions', function (data) {
    console.log("Question message data : ", data);
    removeTyping();
    addSingleSelectionMessage(data);
    if (data.gif_status === true) {
        addTyping();
    }
    updateScrollbar();
});

socket.on('web_url_buttons', function (data) {
    console.log("Web url data : ", data);
    removeTyping();
    addSingleSelectionMessageUrl(data);
    if (data.gif_status === true) {
        addTyping();
    }
    updateScrollbar();
});

socket.on('carousel_image', function (data) {
    removeTyping();
    console.log("carousel_image data : ", data);
    addCarousalImage(data);
});

socket.on('carousel', function (data) {
    removeTyping();
    console.log("carousel_text data : ", data);
    addCarousalText(data);
});

socket.on('external_resource', function (data) {
    removeTyping();
    console.log("external data : ", data);
    addExternalResourceLinkMessage(data);

});

$('#selekt-header-buttons-reset').on('click', function () {
    console.log("reset clicked");
    addUserMessage('reset', 'Reset');
    updateScrollbar();
});

$('#selekt-header-buttons-close').on('click', function () {
    console.log("Close clicked");
    window.parent.postMessage('close', '*');
});


$(document.body).on('click', '.option', function () {
    var sendMsg = this.value;
    var showMsg = this.innerText;
    var belongs = this.name;
    console.log(this.id);
    $(this.id).css('background-color', '#295ba2');
    addUserMessage(sendMsg, showMsg, belongs);
    $('.option').each(function(){
    	$(this).prop('disabled', true);
    	$(this).css('cursor', 'not-allowed');
    });
    
    updateScrollbar();
});

$(document.body).on('click', '.external', function () {
    var sendMsg = this.value;
    var showMsg = this.innerText;
    console.log(sendMsg, " ", showMsg);
    window.open(sendMsg, '_blank');
});
$(".controls").css("width", "calc(100% - 25px)");
var scrollWidth = 230;
$(document.body).on('click', '.control-right', function () {
    event.preventDefault();
    $('.scroll_carousal').animate({

        scrollLeft: "+=" + scrollWidth
    }, "slow");
});
$(document.body).on('click', '.control-left', function () {
    event.preventDefault();
    $('.scroll_carousal').animate({
        scrollLeft: "-=" + scrollWidth
    }, "slow");
});

$(document.body).on('click', '.carousel_option', function () {
    var showMsg = this.innerText;
    var belongs = this.name;
    var typeCarousel = this.value;
    console.log(typeCarousel);
    if (belongs.split(',')[1] === 'postback') {
        addUserMessage(typeCarousel, showMsg, belongs.split(',')[0]);
        $('.carousel_option').each(function(){
        	if(this.name.split(',')[1] === 'postback'){
		    	$(this).prop('disabled', true);
		    	$(this).css('cursor', 'not-allowed');
	    	}
    	});
        updateScrollbar();
    } else if (belongs.split(',')[1] === 'web_url') {
    		$(this).prop('disabled', false);
	    	$(this).css('cursor', 'pointer');
        if (screen.width <= 480) {
            console.log("Opening in mobile popup");
            $('#selekt-container').hide();
            $('#external-link-container').show();
            $('#external-link').attr("src", typeCarousel.split(',')[1]);
        }
        else {
            popupwindow(typeCarousel.split(',')[0], '', 1080, 500);
        }
    }
});

function PopupCenter(url, title, w, h) {
    // Fixes dual-screen position                         Most browsers      Firefox
    var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
    var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

    var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    var left = ((width / 2) - (w / 2)) + dualScreenLeft;
    var top = ((height / 2) - (h / 2)) + dualScreenTop;
    var newWindow = window.open(url, title, 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

    // Puts focus on the newWindow
    if (window.focus) {
        newWindow.focus();
    }
}

function popupwindow(url, title, w, h) {
    var left = (screen.width / 2) - (w / 2);
    var top = (screen.height / 2) - (h / 2);
    return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
}

$(document.body).on('focus', '#chat_input_bar', function () {
    console.log('keyboard open');
    updateScrollbar();
});

$(document.body).on('blur', '#chat_input_bar', function () {
    console.log('keyboard closed');
    updateScrollbar();
});


$(document.body).on('click', '.left', function () {
    $('#carousal_' + chatCount + '_option_').carousel("prev");
});

$(document.body).on('click', '.right', function () {
    $('#carousal_' + chatCount + '_option_').carousel("next");
});


function updateScrollbar() {
    console.log("scrolled");
    /*$(".selekt-conversation-body-parts").animate({scrollTop: current_height + 500});*/
    $(".selekt-conversation-body-parts").stop().animate({scrollTop: $(".selekt-conversation-body-parts")[0].scrollHeight}, 1000);
}

function setDate() {
    /*d = new Date();
     if (m !== d.getMinutes()) {
     m = d.getMinutes();
     $('<div class="timestamp">' + d.getHours() + ':' + m + '</div>').appendTo($('.message:last'));
     }*/
}

function insertMessage() {
    var msg = $('#chat_input_bar').val();
    if ($.trim(msg) === '') {
        return false;
    }
    $('<div class="selekt-conversation-part selekt-conversation-part-user selekt-conversation-part-last">'
        + '<div class="selekt-comment-container selekt-comment-container-user">' +
        '<div class="selekt-comment"><div class="selekt-blocks"><div class="selekt-block selekt-block-paragraph">'
        + msg + '</div></div></div></div>').appendTo($('.selekt-conversation-parts')).show("drop", {
        direction: "down",
        easing: 'easeInOutExpo'
    });
    setDate();
    $('#chat_input_bar').val(null);
    addTyping();
    updateScrollbar();
    sendMessage(msg);
    chatCount++;
    saveChatHistory();
}

function disableChat() {
    $('#chat_input_bar').prop('disabled', true);
    $('#chat_input_bar').css('cursor', 'not-allowed');
}

function enableChat() {
    $('#chat_input_bar').prop('disabled', false);
    $('#chat_input_bar').css('cursor', 'auto');
}

function addUserMessage(sendMsg, showMsg, belongs) {
    $('<div class="selekt-conversation-part selekt-conversation-part-user selekt-conversation-part-last">'
        + '<div class="selekt-comment-container selekt-comment-container-user">' +
        '<div class="selekt-comment"><div class="selekt-blocks"><div class="selekt-block selekt-block-paragraph">'
        + showMsg + '</div></div></div></div>').appendTo($('.selekt-conversation-parts')).show();
    sendMessage(sendMsg, belongs);
    chatCount++;
    saveChatHistory();
    addTyping();
}

function saveChatHistory() {
    // localStorage.setItem("chat_history2", $('.selekt-conversation-parts').html());
}

function addCarousalImage(data) {
    disableChat();
    chatCount++;
    var carousalContainer = $('#main-container-carousal').clone();
    carousalContainer.appendTo($('.selekt-conversation-parts')).show();
    carousalContainer.attr('id', 'carousal_' + chatCount + '_option_');
    var carousal_container = carousalContainer.find('.scroll_carousal');
    for (var i in data.options) {
        var carousal = '<div class="carouselala-inner" id="carousal_' + chatCount + '_option_' +
            '" style=" text-align: justify; width:  calc(100% - 20px); height: auto; overflow: hidden; border: 1px solid #295ba2; border-radius: 5px;"><div class="image" style="width: 100%; height:100%; max-height: 200px; background: transparent url(' + data.options[i].image_url + ') no-repeat scroll center 0;background-size: cover;"></div>' +
            '<p class="title" style="padding:5px;display: block; width: 100% !important; text-align: start; font-weight: 600; margin: 0 auto;">' + data.options[i].title + '</p><div style="background-color: #295ba2; display: block; color: #295ba2; padding: 0; margin: 0; width: 100%; height: 1px;"></div>';
        for (var x in data.options[i].buttons) {
            if (data.options[i].buttons[x].type === 'postback') {
                carousal += '<button name="' + data.belongs + ',' + 'postback' + '" value="' + data.options[i].buttons[x].payload + '" id="single_button_carousal_' + data.options[i].buttons[x] + '" class="carousel_option" style="display: block; font-size: 13px; ">' + data.options[i].buttons[x].title + '</button>';
            } else if (data.options[i].buttons[x].type === 'web_url') {
                carousal += '<button name="' + data.belongs + ',' + 'web_url' + '" value="' + data.options[i].buttons[x].desktop_url + ',' + data.options[i].buttons[x].mobile_url + '" id="single_button_carousal_' + data.options[i].buttons[x] + '" class="carousel_option" style="display: block; font-size: 13px; ">' + data.options[i].buttons[x].title + '</button>';
            }
            if (x != data.options[i].buttons.length - 1) {
                carousal += '<div style="background-color: #295ba2; display: block; color: #295ba2; padding: 0; margin: 0; width: 100%; height: 1px;"></div>';
            }
        }
        $(carousal).appendTo(carousal_container);
    }
    if (data.options.length == 1) {
        carousalContainer.find('.controls').css('display', 'none')
    }
    updateScrollbar();
    saveChatHistory();
}

function addCarousalText(data) {
    disableChat();
    chatCount++;
    var carousalContainer = $('#main-container-carousal').clone();
    carousalContainer.appendTo($('.selekt-conversation-parts')).show();
    carousalContainer.attr('id', 'carousal_' + chatCount + '_option_');
    var carousal_container = carousalContainer.find('.scroll_carousal');
    for (var i in data.options) {
        var carousal = '<div class="carouselala-inner" id="carousal_' + chatCount + '_option_' +
            '" style=" text-align: justify; width:  calc(100% - 20px); height: auto; overflow: hidden; border: 1px solid #295ba2; border-radius: 5px;">' +
            '<p class="title" style="padding:5px;display: block; width: 100% !important; text-align: start; font-weight: 600; margin: 0 auto;word-wrap: break-word;">' + data.options[i].title + '</p><div style="background-color: #295ba2; display: block; color: #295ba2; padding: 0; margin: 0; width: 100%; height: 1px;"></div>';
        for (var x in data.options[i].buttons) {
            if (data.options[i].buttons[x].type === 'postback') {
                carousal += '<button name="' + data.belongs + ',' + 'postback' + '" value="' + data.options[i].buttons[x].payload + '" id="single_button_carousal_' + data.options[i].buttons[x] + '" class="carousel_option" style="display: block; font-size: 13px;word-wrap: break-word; ">' + data.options[i].buttons[x].title + '</button>';
            } else if (data.options[i].buttons[x].type === 'web_url') {
                carousal += '<button name="' + data.belongs + ',' + 'web_url' + '"  value="' + data.options[i].buttons[x].desktop_url + ',' + data.options[i].buttons[x].mobile_url + '" id="single_button_carousal_' + data.options[i].buttons[x] + '" class="carousel_option" style="display: block; font-size: 13px;word-wrap: break-word; ">' + data.options[i].buttons[x].title + '</button>';
            }
            if (x != data.options[i].buttons.length - 1) {
                carousal += '<div style="background-color: #295ba2; display: block; color: #295ba2; padding: 0; margin: 0; width: 100%; height: 1px;"></div>';
            }
        }
        $(carousal).appendTo(carousal_container);
    }
    if (data.options.length == 1) {
        carousalContainer.find('.controls').css('display', 'none')
    }
    updateScrollbar();
    saveChatHistory();
}

function addCarousalSubtitleText(data) {
    disableChat();
    chatCount++;
    var carousalContainer = $('#main-container-carousal').clone();
    carousalContainer.appendTo($('.selekt-conversation-parts')).show();
    carousalContainer.attr('id', 'carousal_' + chatCount + '_option_');
    var carousal_container = carousalContainer.find('.scroll_carousal');
    for (var i in data.options) {
        var carousal = '<div class="carouselala-inner" id="carousal_' + chatCount + '_option_' +
            '" style=" text-align: justify; width:  calc(100% - 20px); height: auto; overflow: auto; border: 1px solid #295ba2; border-radius: 5px;">' +
            '<p class="title" style="padding:2px;display: block; width: 100% !important; text-align: start; font-weight: 600; margin: 0 auto;word-wrap: break-word;">' + data.options[i].title + '</p>' +
            '<p class="subtitle" style="padding:2px; display: block; width: 100% !important; text-align: start; font-weight: 400; margin: 0 auto;word-wrap: break-word;font-size: 13px;white-space: nowrap;">' + data.options[i].subtitle.split('||')[0] + '</p>';
            if(data.options[i].subtitle.split('||')[1]!=undefined){
            carousal += '<p class="subtitle" style="padding:2px; display: block; width: 100% !important; text-align: start; font-weight: 400; margin: 0 auto;word-wrap: break-word;font-size: 13px;white-space: nowrap;">' + data.options[i].subtitle.split('||')[1] + '</p>';
            }
            if(data.options[i].subtitle.split('||')[2]!=undefined){
            carousal += '<p class="subtitle" style="padding:2px; display: block; width: 100% !important; text-align: start; font-weight: 400; margin: 0 auto;word-wrap: break-word;font-size: 13px;white-space: nowrap;">' + data.options[i].subtitle.split('||')[2] + '</p>';
        }
            carousal += '<div style="background-color: #295ba2; display: block; color: #295ba2; padding: 0; margin: 0; width: 100%; height: 1px;"></div>';
        for (var x in data.options[i].buttons) {
            if (data.options[i].buttons[x].type === 'postback') {
                carousal += '<button name="' + data.belongs + ',' + 'postback' + '" value="' + data.options[i].buttons[x].payload + '" id="single_button_carousal_' + data.options[i].buttons[x] + '" class="carousel_option" style="display: block; font-size: 13px; ">' + data.options[i].buttons[x].title + '</button>';
            } else if (data.options[i].buttons[x].type === 'web_url') {
                carousal += '<button name="' + data.belongs + ',' + 'web_url' + '"  value="' + data.options[i].buttons[x].desktop_url + ',' + data.options[i].buttons[x].mobile_url + '" id="single_button_carousal_' + data.options[i].buttons[x] + '" class="carousel_option" style="display: block; font-size: 13px; ">' + data.options[i].buttons[x].title + '</button>';
            }
            if (x != data.options[i].buttons.length - 1) {
                carousal += '<div style="background-color: #295ba2; display: block; color: #295ba2; padding: 0; margin: 0; width: 100%; height: 1px;"></div>';
            }
        }
        $(carousal).appendTo(carousal_container);
    }
    if (data.options.length == 1) {
        carousalContainer.find('.controls').css('display', 'none');
    }
    updateScrollbar();
    saveChatHistory();
}

function sendMessage(message, belongs) {
    let auth_token = getCookieValue('userToken');
    let current_url = getCurrentURL();
    var data = {
        message: message,
        belongs: belongs ? undefined : 'suggestions',
        device_id: device_id,
        user_name: localStorage.getItem("visitor_name"),
        auth_token : auth_token?auth_token:"",
        current_url : current_url?current_url:""
    };
    socket.emit('user_message', JSON.stringify(data));
}

function sessionId() {
    if (getCookie("session_id") !== '') {
        return getCookie("session_id");
    } else {
        return session_id;
    }
}

$('.selekt-composer-send-button').click(function () {
    insertMessage();
});

$(window).on('keydown', function (e) {
    if (e.which === 13) {
        insertMessage();
        return false;
    }
});

function removeTyping() {
    $('.typing').remove();
    updateScrollbar();
    chatCount--;
}

function addTyping() {
    chatCount++;
    $('<div class="selekt-conversation-part selekt-conversation-part-admin selekt-conversation-part-grouped typing">'
        + '<div class="selekt-comment-container selekt-comment-container-admin">' +
        '<div class="selekt-comment"><div class="selekt-blocks"><div class="selekt-block selekt-block-paragraph" style="width: 40px;"><img src="../images/typing.gif" style="width: 75%; height:auto;"></div></div></div></div></div>').appendTo($('.selekt-conversation-parts')).show("drop", {
        direction: "down",
        easing: 'easeInOutExpo'
    });
    updateScrollbar();
    setDate();
}

function addTextMessage(data) {
    enableChat();
    chatCount++;
    var msg = data.message.replace(/\n\n/g, '<br/><br/>');
    msg = data.message.replace(/\n/g, '<br/>');
    $('<div class="selekt-conversation-part selekt-conversation-part-admin selekt-conversation-part-grouped">'
        + '<div class="selekt-comment-container selekt-comment-container-admin">' +
        '<div class="selekt-comment"><div class="selekt-blocks"><div class="selekt-block selekt-block-paragraph"><p>'
        + msg + '</p></div></div></div></div></div>').appendTo($('.selekt-conversation-parts')).show("drop", {
        direction: "down",
        easing: 'easeInOutExpo'
    });
    updateScrollbar();
    setDate();
    saveChatHistory();
}

function addExternalResourceLinkMessage(data) {
    disableChat();
    chatCount++;
    var msg = data.text.replace(/\n\n/g, '<br/><br/>');
    msg = data.text.replace(/\n/g, '<br/>');
    $('<div class="selekt-conversation-part selekt-conversation-part-admin selekt-conversation-part-grouped">'
        + '<div class="selekt-comment-container selekt-comment-container-admin">' +
        '<div class="selekt-comment"><div class="selekt-blocks"><div class="selekt-block selekt-block-paragraph">'
        + msg + '</div></div></div></div></div>').appendTo($('.selekt-conversation-parts')).show("drop", {
        direction: "down",
        easing: 'easeInOutExpo'
    });
    var singleSelectOptions = $('#external_data_options').clone();
    singleSelectOptions.attr('id', 'chat_' + chatCount);
    for (var i in data.options) {
        var button = $('#external_button').clone();
        button.attr('id', 'external_' + chatCount + "_option_" + i);
        button.attr('name', data.belongs);
        button.val(data.options[i].url);
        button.text(data.options[i].title);
        singleSelectOptions.find('.single_select_ul').append(button);
        button.show();
        if (i >= 0 && i != data.options.length - 1) {
            console.log(i, "==", data.options.length - 1);
            var bifurcation = $('#bifurcation').clone();
            singleSelectOptions.find('.single_select_ul').append(bifurcation);
            bifurcation.show();
        }
    }
    singleSelectOptions.appendTo($('.selekt-comment-container:last')).show();
    updateScrollbar();
    saveChatHistory();
}

function addSingleSelectionMessage(data) {
    disableChat();
    chatCount++;
    var msg = data.text.replace(/\n\n/g, '<br/><br/>');
    msg = data.text.replace(/\n/g, '<br/>');
    $('<div class="selekt-conversation-part selekt-conversation-part-admin selekt-conversation-part-grouped">'
        + '<div class="selekt-comment-container selekt-comment-container-admin">' +
        '<div class="selekt-comment"><div class="selekt-blocks"><div class="selekt-block selekt-block-paragraph">'
        + msg + '</div></div></div></div></div>').appendTo($('.selekt-conversation-parts')).show("drop", {
        direction: "down",
        easing: 'easeInOutExpo'
    });
    var singleSelectOptions = $('#single_select_options').clone();
    singleSelectOptions.attr('id', 'chat_' + chatCount);
    for (var i in data.options) {
        var button = $('#single_button').clone();
        button.attr('id', 'single_' + chatCount + "_option_" + i);
        button.attr('name', data.belongs);
        button.val(data.options[i].key);
        button.text(data.options[i].value);
        singleSelectOptions.find('.single_select_ul').append(button);
        button.prop('disabled', false);
    	button.css('cursor', 'pointer');
        button.show();
        if (i >= 0 && i != data.options.length - 1) {
            console.log(i, "==", data.options.length - 1);
            var bifurcation = $('#bifurcation').clone();
            singleSelectOptions.find('.single_select_ul').append(bifurcation);
            bifurcation.show();
        }
    }
    singleSelectOptions.appendTo($('.selekt-comment-container:last')).show();
    updateScrollbar();
    saveChatHistory();
}

function addSingleSelectionMessageUrl(data) {
    disableChat();
    chatCount++;
    var msg = data.text.replace(/\n\n/g, '<br/><br/>');
    msg = data.text.replace(/\n/g, '<br/>');
    $('<div class="selekt-conversation-part selekt-conversation-part-admin selekt-conversation-part-grouped">'
        + '<div class="selekt-comment-container selekt-comment-container-admin">' +
        '<div class="selekt-comment"><div class="selekt-blocks"><div class="selekt-block selekt-block-paragraph">'
        + msg + '</div></div></div></div></div>').appendTo($('.selekt-conversation-parts')).show("drop", {
        direction: "down",
        easing: 'easeInOutExpo'
    });
    var singleSelectOptions = $('#single_select_options').clone();
    singleSelectOptions.attr('id', 'chat_' + chatCount);
    for (var i in data.options) {
        var button = $('#single_button_url').clone();
        button.attr('id', 'single_' + chatCount + "_option_" + i);
        if (data.options[i].type === 'postback') {
            button.attr('name', data.belongs + ',' + 'postback');
            button.val(data.options[i].payload);
        } else if (data.options[i].type === 'web_url') {
            button.attr('name', data.belongs + ',' + 'web_url');
            button.val(data.options[i].desktop_url + ',' + data.options[i].mobile_url);
        }
        button.text(data.options[i].title);
        singleSelectOptions.find('.single_select_ul').append(button);
        button.show();
        if (i >= 0 && i != data.options.length - 1) {
            console.log(i, "==", data.options.length - 1);
            var bifurcation = $('#bifurcation').clone();
            singleSelectOptions.find('.single_select_ul').append(bifurcation);
            bifurcation.show();
        }
    }
    singleSelectOptions.appendTo($('.selekt-comment-container:last')).show();
    updateScrollbar();
    saveChatHistory();
}