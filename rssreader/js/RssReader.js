/* 
 * Copyright 2013 Intelligent Technology Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
 $(function() {
	var ajax_proxy = "http://localhost:8888/firefoxOS/rssreaderproxy/rssproxy.php";
	
	var title = "";
	$(".rsslink").on("click", function(e) {
		var url = $(this).attr("url");
		
		title = $("h3",this).text();
		
		url = "http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=50&q=" + encodeURIComponent(url);
		
		//クロスサイトリクエストになるので、エラーをさけるため、対策のなされたサイトを経由
		url = ajax_proxy + "?url=" + encodeURIComponent(url);
		
		$.ajax({
			url: url,
			dataType: "json",
		}).done(function(data) {
			
			makeNewPage(data);		
		}).fail(function(xhr, status) {
			console.log(url);
			$("#dialog #dlg_content").html("<p>error:" + status + "</p>" + url);
			$.mobile.changePage("#dialog", {transition:"pop"});			
		});
		
	});
	
	$("#itemlist").on('pagebeforeshow', function() {
		
		$("#itemlist_listview").listview('refresh');
	});

	
	var getPubDateString = function(pubDate, dtRef) {
		var diff = dtRef - pubDate;
		
		if (diff >= 3600000*24) {
			var year = pubDate.getFullYear();
			var mon = pubDate.getMonth() + 1;
			var day = pubDate.getDate();
			
			if (mon < 10)
				mon = '0' + mon;
			
			if (day < 10)
				day = '0' + day;
			
			var hour = pubDate.getHours();
			var min = pubDate.getMinutes();
			var sec = pubDate.getSeconds();
			
			if (hour < 10) hour = '0' + hour;
			if (min < 10) min = '0' + min;
			if (sec < 10) sec = '0' + sec;
			
			return year + "/" + mon + "/" + day + " " + hour + ":" + min + ":" + sec;
		}
		else {
			var hours = Math.floor(diff/(3600000));
			var mins = Math.floor((diff - hours*3600000)/60000);

			var str = "";
			if (hours > 0)
				hours += hours + '時間';
			if (mins > 0)
				str += mins + "分";
			str += "前";
			
			return str;
		}
	};
	
	var makeNewPage = function(data) {
		if (data['responseStatus'] == "200") {
			var res = data['responseData'];
			var feed = res['feed'];
			var entries = feed['entries'];
			
			entries.sort(function(item1, item2) {
				
				return new Date(item2['publishedDate']) - new Date(item1['publishedDate']);
			});
			
			
			$("#itemlist_title").text(title);
			
			var body = '';
			
			if ($("#itemlist_listview").children().length > 0) {
				$("#itemlist_listview").children().remove();
			}
			
			var dtRef = new Date();
			var ind = 0;
			$.each(entries, function(key, entry) {
				var dt = new Date(entry['publishedDate']);
				
				var title = entry['title'];
				var author = "";
				
				var arrTemp = title.split("-");
				title = arrTemp[0];
				if (arrTemp.length > 1)
					author = arrTemp[1];
				
				var url = entry['link'];
				
				var pubDate = getPubDateString(dt, dtRef);
				
				//summary
				var iframe = $('<iframe style="display:none">');
				var html = entry['content'];
				
				var longest = "";
				iframe.load(function() {
					$(this).contents().find('body').append(html);
					
					iframe.contents().find('font').each(function(index) {
						var elems = $(this).find('font');
						if (elems.length == 0) {
							var text = $(this).text();
							if (text.length > longest.length)
								longest = text;
						}
					});
					
					html = "<li>";
					html += '<a class="detaillink" url="' + url + '">';
					html += '<h3>' + title + '</h3>';
					html += '<div style="float:left;font-size:8pt;">' + author + '</div>';
					html += '<div style="float:right;font-size:8pt;font-color:#00e;">' + pubDate + '</div>';
					html += '<p style="clear:both;">' + longest + '</p>';
					html += '</a>';
					html += '</li>';
					
					$("#itemlist_listview").append(html);
					
					$(this).remove();
					
					ind++;
					if (ind == entries.length-1) {
						$.mobile.changePage('#itemlist', {transition:"slide"});				
					}
				}).appendTo('body');
				
			});
			
		}
	};
	
	$(document).on("click", ".detaillink", function(e) {
		var url = $(this).attr("url");
		title = $("h3",this).text();
		
		$("#itemdetail_title").text(title);
		url = ajax_proxy + "?url=" + encodeURIComponent(url);			
		
		console.log(url);
		
		$.ajax({
			url: url,
			dataType: "html",
		}).done(function(data) {
			data = preprocessData(data);

			var iframe = $('<iframe style="display:none">');

			iframe.load(function() {
				$(this).contents().find('body').append(data);
				
				var obj = readability.parse($(iframe)[0].contentWindow);
				
				iframe.remove();
						
				$("#itemdetail_content").children().remove();
				
				var txt = '';
				txt +=  obj['content'].innerHTML;
				
				$("#itemdetail_content").append(txt);

				$.mobile.changePage('#itemdetail', {transition:"slide"})
				
			}).appendTo('body');
			
		}).fail(function(xhr, status) {
			console.log("+++++ fail:" + status + " +++++");
			$("#dialog #dlg_content").html("error:" + status);
			$.mobile.changePage("#dialog", {transition:"popup",});			
		});
		
	});
	
	var preprocessData = function(data) {
		try {
			var ind = data.indexOf("<?xml");
			if (ind >= 0) {
				for (var i = ind+1;i < data.length; i++) {
					if (data.charAt(i) == ">") {
						data = data.substring(i+1);
						break;
					}
				}
			}
			
			var tempDiv =$('<div>');
			tempDiv[0].innerHTML = data;
			var scr = tempDiv.find('script');
			scr.each(function(ind) {
				$(this).remove();
			});
			
			//link
			scr = tempDiv.find('link');
			scr.each(function(ind) {
				$(this).remove();
			});
			
			//style
			scr = tempDiv.find('style');
			scr.each(function(ind) {
				$(this).remove();
			});
			
			//img
			scr = tempDiv.find('img');
			scr.each(function(ind) {
				$(this).remove();
			});
						
			return tempDiv.html();
		}
		catch(ex) {
			return data;
		}
	};
	
	if (redirectToHome) {
		$.mobile.changePage('#menu', null);
		location.hash = "";
		redirectToHome = false;
	}
			
	
});