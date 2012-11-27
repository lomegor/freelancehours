/**
 * Copyright 2012 Sebastian Ventura
 * This file is part of freelancehours.
 *
 * freelancehours is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * frelancehours is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with freelancehours.  If not, see <http://www.gnu.org/licenses/>.
 */

$(document).ready(function() {
	$("#project").change(changeIfNew);
	$("#task-form-section form").submit(newTask);
	$(document).on('click','.starter',start);
	$(document).on('click','.stoper',stop);
	$(document).on('click','.deleter',remove);
	$('.stoper').each(function() {
		var $tr = $(this).parent().parent();
		var $that = $(this);
		var p = $tr.find(".project").text();
		var n = $tr.find(".name").text();
		var h = $tr.find(".hour");
		if (!counter[p]) {
			counter[p] = {};
		}
		counter[p][n] = 1;
		setTimeout(function(){count(h,p,n)},1000);
		counting = 1;
	});
	totalCounter = $("#dailyhours .total");
	todayCounter = $("#dailyhours .today");
	setTimeout(countDay,1000);
});

var totalCounter;
var todayCounter;
var counting = 0;

var newProject = 0;

var counter = {};

function updateTime(e) {
	var matches = /(\d+):(\d\d):(\d\d)/.exec(e.text());
	var h = parseInt(matches[1],10);
	var m = parseInt(matches[2],10);
	var s = parseInt(matches[3],10);
	if (s == 59) {
		s = 0;
		if (m == 59) {
			m = 0;
			h+=1;
		} else {
			m+=1;
		}
	} else {
		s+=1;
	}
	h<10 && (h="0"+h);
	m<10 && (m="0"+m);
	s<10 && (s="0"+s);
	e.text(h+":"+m+":"+s);
}

function countDay() {
	if (counting) {
		updateTime(totalCounter);
		updateTime(todayCounter);
	}
	setTimeout(countDay,1000);
}

function count(e,p,n) {
	if (counter[p] && counter[p][n] && counter[p][n]==1) {
		updateTime(e);
		setTimeout(function(){count(e,p,n)},1000);
	} else if (counter[p] && counter[p][n]) {
		delete counter[p][n];
	}
};

function start() {
	$(".stoper").click();
	$(this).removeClass("starter");
	$(this).addClass("stoper");
	$(this).text("Stop");
	var $tr = $(this).parent().parent();
	var $that = $(this);
	var p = $tr.find(".project").text();
	var n = $tr.find(".name").text();
	var h = $tr.find(".hour");
	$.getJSON(
		'/'+p+'/'+n,
		{method:"start"},
		function (data) {
			if (data.error == 1) {
				error(data.data);
				$that.removeClass("stoper");
				$that.addClass("starter");
				$that.text("Start");
				return;
			}
			counting = 1;
		});
	if (!counter[p]) {
		counter[p] = {};
	}
	counter[p][n] = 1;
	setTimeout(function(){count(h,p,n)},1000);
};

function stop() {
	$(this).removeClass("stoper");
	$(this).addClass("starter");
	$(this).text("Start");
	var $tr = $(this).parent().parent();
	var $that = $(this);
	var p = $tr.find(".project").text();
	var n = $tr.find(".name").text();
	var h = $tr.find(".hour");
	$.getJSON(
		'/'+p+'/'+n,
		{method:"stop"},
		function (data) {
			if (data.error == 1) {
				error(data.data);
				$that.removeClass("starter");
				$that.addClass("stoper");
				$that.text("Stop");
				return;
			}
			h.text(data.data);
			counting = 0;
		});
	if (counter[p] && counter[p][n]) {
		counter[p][n] = 0;
	}
};

function remove() {
	var $td = $(this).parent();
	var $tr = $td.parent();
	var p = $tr.find(".project").text();
	var n = $tr.find(".name").text();
	$td.html("");
	$.getJSON(
		'/'+p+'/'+n,
		{method:"delete"},
		function (data) {
			if (data.error == 1) {
				error(data.data);
				return;
			}
			$tr.remove();
		});
};

function changeIfNew(evt) {
	if ($(this).val() == 'new') {
		$(this).hide();
		$("#newproject").show();
		newProject = 1;
	};
};

function newTask(evt) {
	evt.preventDefault();
	var p;
	if (newProject) {
		p = $("#newproject").val();
	} else {
		p = $("#project").val();
	}
	if (p == 'all' || p == 'new') {
		error("No way to create task for All");
		return false;
	};
	var n = $("#newtask").val();
	var d = $("#newdescr").val();
	$.getJSON(
		'/'+p+'/'+n,
		{descr:d},
		function (data) {
			if (data.error == 1) {
				error(data.data);
				return;
			}
			if (newProject) {
				$("#project").append($("<option value=\""+p+"\">"+p+"</option>"));
				$("#newproject").hide();
				$("#project").val(p);
				$("#project").show();
				newProject = 0;
			}
			$("#tasks").append($("<tr>"+
					"<td><button class=\"btn changer starter\" value=\"start\">Start</button></td>"+
					"<td class=\"name\">"+n+"</td>"+
					"<td class=\"project\">"+p+"</td>"+
					"<td class=\"descr\">"+d+"</td>"+
					"<td class=\"hour\">"+data.data+"</td>"+
					"<td><button class=\"btn deleter\" value=\"delete\">Delete</button></td>"+
				"</tr>")).find('.starter').click();
		}
	);
	return false;
};

function error(string) {
    $("#error").css({visibility: 'visible'});
    $("#error").css({display: 'block'});
	$("#error").text(string);
	setTimeout(function() {
        $("#error").text("");
        $("#error").css({visibility: 'hidden'});
        $("#error").css({display: 'none'});
    }, 5000);
};
