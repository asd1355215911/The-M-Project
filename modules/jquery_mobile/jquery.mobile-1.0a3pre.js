/*!
 * jQuery Mobile v1.0a3pre
 * http://jquerymobile.com/
 *
 * Copyright 2010, jQuery Project
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 */
/*!
 * jQuery UI Widget @VERSION
 *
 * Copyright 2010, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Widget
 */
(function( $, undefined ) {

// jQuery 1.4+
if ( $.cleanData ) {
	var _cleanData = $.cleanData;
	$.cleanData = function( elems ) {
		for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
			$( elem ).triggerHandler( "remove" );
		}
		_cleanData( elems );
	};
} else {
	var _remove = $.fn.remove;
	$.fn.remove = function( selector, keepData ) {
		return this.each(function() {
			if ( !keepData ) {
				if ( !selector || $.filter( selector, [ this ] ).length ) {
					$( "*", this ).add( [ this ] ).each(function() {
						$( this ).triggerHandler( "remove" );
					});
				}
			}
			return _remove.call( $(this), selector, keepData );
		});
	};
}

$.widget = function( name, base, prototype ) {
	var namespace = name.split( "." )[ 0 ],
		fullName;
	name = name.split( "." )[ 1 ];
	fullName = namespace + "-" + name;

	if ( !prototype ) {
		prototype = base;
		base = $.Widget;
	}

	// create selector for plugin
	$.expr[ ":" ][ fullName ] = function( elem ) {
		return !!$.data( elem, name );
	};

	$[ namespace ] = $[ namespace ] || {};
	$[ namespace ][ name ] = function( options, element ) {
		// allow instantiation without initializing for simple inheritance
		if ( arguments.length ) {
			this._createWidget( options, element );
		}
	};

	var basePrototype = new base();
	// we need to make the options hash a property directly on the new instance
	// otherwise we'll modify the options hash on the prototype that we're
	// inheriting from
//	$.each( basePrototype, function( key, val ) {
//		if ( $.isPlainObject(val) ) {
//			basePrototype[ key ] = $.extend( {}, val );
//		}
//	});
	basePrototype.options = $.extend( true, {}, basePrototype.options );
	$[ namespace ][ name ].prototype = $.extend( true, basePrototype, {
		namespace: namespace,
		widgetName: name,
		widgetEventPrefix: $[ namespace ][ name ].prototype.widgetEventPrefix || name,
		widgetBaseClass: fullName
	}, prototype );

	$.widget.bridge( name, $[ namespace ][ name ] );
};

$.widget.bridge = function( name, object ) {
	$.fn[ name ] = function( options ) {
		var isMethodCall = typeof options === "string",
			args = Array.prototype.slice.call( arguments, 1 ),
			returnValue = this;

		// allow multiple hashes to be passed on init
		options = !isMethodCall && args.length ?
			$.extend.apply( null, [ true, options ].concat(args) ) :
			options;

		// prevent calls to internal methods
		if ( isMethodCall && options.charAt( 0 ) === "_" ) {
			return returnValue;
		}

		if ( isMethodCall ) {
			this.each(function() {
				var instance = $.data( this, name );
				if ( !instance ) {
					throw "cannot call methods on " + name + " prior to initialization; " +
						"attempted to call method '" + options + "'";
				}
				if ( !$.isFunction( instance[options] ) ) {
					throw "no such method '" + options + "' for " + name + " widget instance";
				}
				var methodValue = instance[ options ].apply( instance, args );
				if ( methodValue !== instance && methodValue !== undefined ) {
					returnValue = methodValue;
					return false;
				}
			});
		} else {
			this.each(function() {
				var instance = $.data( this, name );
				if ( instance ) {
					instance.option( options || {} )._init();
				} else {
					$.data( this, name, new object( options, this ) );
				}
			});
		}

		return returnValue;
	};
};

$.Widget = function( options, element ) {
	// allow instantiation without initializing for simple inheritance
	if ( arguments.length ) {
		this._createWidget( options, element );
	}
};

$.Widget.prototype = {
	widgetName: "widget",
	widgetEventPrefix: "",
	options: {
		disabled: false
	},
	_createWidget: function( options, element ) {
		// $.widget.bridge stores the plugin instance, but we do it anyway
		// so that it's stored even before the _create function runs
		$.data( element, this.widgetName, this );
		this.element = $( element );
		this.options = $.extend( true, {},
			this.options,
			this._getCreateOptions(),
			options );

		var self = this;
		this.element.bind( "remove." + this.widgetName, function() {
			self.destroy();
		});

		this._create();
		this._trigger( "create" );
		this._init();
	},
	_getCreateOptions: function() {
		var options = {};
		if ( $.metadata ) {
			options = $.metadata.get( element )[ this.widgetName ];
		}
		return options;
	},
	_create: function() {},
	_init: function() {},

	destroy: function() {
		this.element
			.unbind( "." + this.widgetName )
			.removeData( this.widgetName );
		this.widget()
			.unbind( "." + this.widgetName )
			.removeAttr( "aria-disabled" )
			.removeClass(
				this.widgetBaseClass + "-disabled " +
				"ui-state-disabled" );
	},

	widget: function() {
		return this.element;
	},

	option: function( key, value ) {
		var options = key;

		if ( arguments.length === 0 ) {
			// don't return a reference to the internal hash
			return $.extend( {}, this.options );
		}

		if  (typeof key === "string" ) {
			if ( value === undefined ) {
				return this.options[ key ];
			}
			options = {};
			options[ key ] = value;
		}

		this._setOptions( options );

		return this;
	},
	_setOptions: function( options ) {
		var self = this;
		$.each( options, function( key, value ) {
			self._setOption( key, value );
		});

		return this;
	},
	_setOption: function( key, value ) {
		this.options[ key ] = value;

		if ( key === "disabled" ) {
			this.widget()
				[ value ? "addClass" : "removeClass"](
					this.widgetBaseClass + "-disabled" + " " +
					"ui-state-disabled" )
				.attr( "aria-disabled", value );
		}

		return this;
	},

	enable: function() {
		return this._setOption( "disabled", false );
	},
	disable: function() {
		return this._setOption( "disabled", true );
	},

	_trigger: function( type, event, data ) {
		var callback = this.options[ type ];

		event = $.Event( event );
		event.type = ( type === this.widgetEventPrefix ?
			type :
			this.widgetEventPrefix + type ).toLowerCase();
		data = data || {};

		// copy original event properties over to the new event
		// this would happen if we could call $.event.fix instead of $.Event
		// but we don't have a way to force an event to be fixed multiple times
		if ( event.originalEvent ) {
			for ( var i = $.event.props.length, prop; i; ) {
				prop = $.event.props[ --i ];
				event[ prop ] = event.originalEvent[ prop ];
			}
		}

		this.element.trigger( event, data );

		return !( $.isFunction(callback) &&
			callback.call( this.element[0], event, data ) === false ||
			event.isDefaultPrevented() );
	}
};

})( jQuery );
/*
* jQuery Mobile Framework : widget factory extentions for mobile
* Copyright (c) jQuery Project
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*/
(function($, undefined ) {

$.widget( "mobile.widget", {
	_getCreateOptions: function() {
		var elem = this.element,
			options = {};
		$.each( this.options, function( option ) {
			var value = elem.data( option.replace( /[A-Z]/g, function( c ) {
				return "-" + c.toLowerCase();
			} ) );
			if ( value !== undefined ) {
				options[ option ] = value;
			}
		});
		return options;
	}
});

})( jQuery );
/*
* jQuery Mobile Framework : resolution and CSS media query related helpers and behavior
* Copyright (c) jQuery Project
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*/
(function($, undefined ) {

var $window = $(window),
	$html = $( "html" ),

	//media-query-like width breakpoints, which are translated to classes on the html element
	resolutionBreakpoints = [320,480,768,1024];


/* $.mobile.media method: pass a CSS media type or query and get a bool return
	note: this feature relies on actual media query support for media queries, though types will work most anywhere
	examples:
		$.mobile.media('screen') //>> tests for screen media type
		$.mobile.media('screen and (min-width: 480px)') //>> tests for screen media type with window width > 480px
		$.mobile.media('@media screen and (-webkit-min-device-pixel-ratio: 2)') //>> tests for webkit 2x pixel ratio (iPhone 4)
*/
$.mobile.media = (function() {
	// TODO: use window.matchMedia once at least one UA implements it
	var cache = {},
		testDiv = $( "<div id='jquery-mediatest'>" ),
		fakeBody = $( "<body>" ).append( testDiv );

	return function( query ) {
		if ( !( query in cache ) ) {
			var styleBlock = $( "<style type='text/css'>" +
				"@media " + query + "{#jquery-mediatest{position:absolute;}}" +
				"</style>" );
			$html.prepend( fakeBody ).prepend( styleBlock );
			cache[ query ] = testDiv.css( "position" ) === "absolute";
			fakeBody.add( styleBlock ).remove();
		}
		return cache[ query ];
	};
})();

/*
	private function for adding/removing breakpoint classes to HTML element for faux media-query support
	It does not require media query support, instead using JS to detect screen width > cross-browser support
	This function is called on orientationchange, resize, and mobileinit, and is bound via the 'htmlclass' event namespace
*/
function detectResolutionBreakpoints(){
	var currWidth = $window.width(),
		minPrefix = "min-width-",
		maxPrefix = "max-width-",
		minBreakpoints = [],
		maxBreakpoints = [],
		unit = "px",
		breakpointClasses;

	$html.removeClass( minPrefix + resolutionBreakpoints.join(unit + " " + minPrefix) + unit + " " +
		maxPrefix + resolutionBreakpoints.join( unit + " " + maxPrefix) + unit );

	$.each(resolutionBreakpoints,function( i, breakPoint ){
		if( currWidth >= breakPoint ){
			minBreakpoints.push( minPrefix + breakPoint + unit );
		}
		if( currWidth <= breakPoint ){
			maxBreakpoints.push( maxPrefix + breakPoint + unit );
		}
	});

	if( minBreakpoints.length ){ breakpointClasses = minBreakpoints.join(" "); }
	if( maxBreakpoints.length ){ breakpointClasses += " " +  maxBreakpoints.join(" "); }

	$html.addClass( breakpointClasses );
};

/* $.mobile.addResolutionBreakpoints method:
	pass either a number or an array of numbers and they'll be added to the min/max breakpoint classes
	Examples:
		$.mobile.addResolutionBreakpoints( 500 );
		$.mobile.addResolutionBreakpoints( [500, 1200] );
*/
$.mobile.addResolutionBreakpoints = function( newbps ){
	if( $.type( newbps ) === "array" ){
		resolutionBreakpoints = resolutionBreakpoints.concat( newbps );
	}
	else {
		resolutionBreakpoints.push( newbps );
	}
	resolutionBreakpoints.sort(function(a,b){ return a-b; });
	detectResolutionBreakpoints();
};

/* 	on mobileinit, add classes to HTML element
	and set handlers to update those on orientationchange and resize*/
$(document).bind("mobileinit.htmlclass", function(){
	/* bind to orientationchange and resize
	to add classes to HTML element for min/max breakpoints and orientation */
	$window.bind("orientationchange.htmlclass resize.htmlclass", function(event){
		//add orientation class to HTML element on flip/resize.
		if(event.orientation){
			$html.removeClass( "portrait landscape" ).addClass( event.orientation );
		}
		//add classes to HTML element for min/max breakpoints
		detectResolutionBreakpoints();
	});

	//trigger event manually
	$window.trigger( "orientationchange.htmlclass" );
});

})(jQuery);/*
* jQuery Mobile Framework : support tests
* Copyright (c) jQuery Project
* Dual licensed under the MIT (MIT-LICENSE.txt) and GPL (GPL-LICENSE.txt) licenses.
* Note: Code is in draft form and is subject to change 
*/
(function($, undefined ) {



var fakeBody = $( "<body>" ).prependTo( "html" ),
	fbCSS = fakeBody[0].style,
	vendors = ['webkit','moz','o'],
	webos = window.palmGetResource || window.PalmServiceBridge, //only used to rule out scrollTop 
	bb = window.blackberry; //only used to rule out box shadow, as it's filled opaque on BB

//thx Modernizr
function propExists( prop ){
	var uc_prop = prop.charAt(0).toUpperCase() + prop.substr(1),
		props   = (prop + ' ' + vendors.join(uc_prop + ' ') + uc_prop).split(' ');
	for(var v in props){
		if( fbCSS[ v ] !== undefined ){
			return true;
		}
	}
};

//test for dynamic-updating base tag support (allows us to avoid href,src attr rewriting)
function baseTagTest(){
	var fauxBase = location.protocol + '//' + location.host + location.pathname + "ui-dir/",
		base = $("<base>", {"href": fauxBase}).appendTo("head"),
		link = $( "<a href='testurl'></a>" ).prependTo( fakeBody ),
		rebase = link[0].href;
	base[0].href = location.pathname;	
	base.remove();
	return rebase.indexOf(fauxBase) === 0;
};

$.extend( $.support, {
	orientation: "orientation" in window,
	touch: "ontouchend" in document,
	cssTransitions: "WebKitTransitionEvent" in window,
	pushState: !!history.pushState,
	mediaquery: $.mobile.media('only all'),
	cssPseudoElement: !!propExists('content'),
	boxShadow: !!propExists('boxShadow') && !bb,
	scrollTop: ("pageXOffset" in window || "scrollTop" in document.documentElement || "scrollTop" in fakeBody[0]) && !webos,
	dynamicBaseTag: baseTagTest()
});

fakeBody.remove();

//for ruling out shadows via css
if( !$.support.boxShadow ){ $('html').addClass('ui-mobile-nosupport-boxshadow'); }

})( jQuery );/*
* jQuery Mobile Framework : events
* Copyright (c) jQuery Project
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*/
(function($, undefined ) {

// add new event shortcuts
$.each( "touchstart touchmove touchend orientationchange tap taphold swipe swipeleft swiperight scrollstart scrollstop".split( " " ), function( i, name ) {
	$.fn[ name ] = function( fn ) {
		return fn ? this.bind( name, fn ) : this.trigger( name );
	};
	$.attrFn[ name ] = true;
});

var supportTouch = $.support.touch,
	scrollEvent = "touchmove scroll",
	touchStartEvent = supportTouch ? "touchstart" : "mousedown",
	touchStopEvent = supportTouch ? "touchend" : "mouseup",
	touchMoveEvent = supportTouch ? "touchmove" : "mousemove";

// also handles scrollstop
$.event.special.scrollstart = {
	enabled: true,
	
	setup: function() {
		var thisObject = this,
			$this = $( thisObject ),
			scrolling,
			timer;
		
		function trigger( event, state ) {
			scrolling = state;
			var originalType = event.type;
			event.type = scrolling ? "scrollstart" : "scrollstop";
			$.event.handle.call( thisObject, event );
			event.type = originalType;
		}
		
		// iPhone triggers scroll after a small delay; use touchmove instead
		$this.bind( scrollEvent, function( event ) {
			if ( !$.event.special.scrollstart.enabled ) {
				return;
			}
			
			if ( !scrolling ) {
				trigger( event, true );
			}
			
			clearTimeout( timer );
			timer = setTimeout(function() {
				trigger( event, false );
			}, 50 );
		});
	}
};

// also handles taphold
$.event.special.tap = {
	setup: function() {
		var thisObject = this,
			$this = $( thisObject );
		
		$this
			.bind( touchStartEvent, function( event ) {
				if ( event.which && event.which !== 1 ) {
					return;
				}
				
				var moved = false,
					touching = true,
					origPos = [ event.pageX, event.pageY ],
					originalType,
					timer;
				
				function moveHandler() {
					if ((Math.abs(origPos[0] - event.pageX) > 10) ||
					    (Math.abs(origPos[1] - event.pageY) > 10)) {
					    moved = true;
					}
				}
				
				timer = setTimeout(function() {
					if ( touching && !moved ) {
						originalType = event.type;
						event.type = "taphold";
						$.event.handle.call( thisObject, event );
						event.type = originalType;
					}
				}, 750 );
				
				$this
					.one( touchMoveEvent, moveHandler)
					.one( touchStopEvent, function( event ) {
						$this.unbind( touchMoveEvent, moveHandler );
						clearTimeout( timer );
						touching = false;
						
						if ( !moved ) {
							originalType = event.type;
							event.type = "tap";
							$.event.handle.call( thisObject, event );
							event.type = originalType;
						}
					});
			});
	}
};

// also handles swipeleft, swiperight
$.event.special.swipe = {
	setup: function() {
		var thisObject = this,
			$this = $( thisObject );
		
		$this
			.bind( touchStartEvent, function( event ) {
				var data = event.originalEvent.touches ?
						event.originalEvent.touches[ 0 ] :
						event,
					start = {
						time: (new Date).getTime(),
						coords: [ data.pageX, data.pageY ],
						origin: $( event.target )
					},
					stop;
				
				function moveHandler( event ) {
					if ( !start ) {
						return;
					}
					
					var data = event.originalEvent.touches ?
							event.originalEvent.touches[ 0 ] :
							event;
					stop = {
							time: (new Date).getTime(),
							coords: [ data.pageX, data.pageY ]
					};
					
					// prevent scrolling
					if ( Math.abs( start.coords[0] - stop.coords[0] ) > 10 ) {
						event.preventDefault();
					}
				}
				
				$this
					.bind( touchMoveEvent, moveHandler )
					.one( touchStopEvent, function( event ) {
						$this.unbind( touchMoveEvent, moveHandler );
						if ( start && stop ) {
							if ( stop.time - start.time < 1000 && 
									Math.abs( start.coords[0] - stop.coords[0]) > 30 &&
									Math.abs( start.coords[1] - stop.coords[1]) < 75 ) {
								start.origin
								.trigger( "swipe" )
								.trigger( start.coords[0] > stop.coords[0] ? "swipeleft" : "swiperight" );
							}
						}
						start = stop = undefined;
					});
			});
	}
};

(function($){
	// "Cowboy" Ben Alman
	
	var win = $(window),
		special_event,
		get_orientation,
		last_orientation;
	
	$.event.special.orientationchange = special_event = {
		setup: function(){
			// If the event is supported natively, return false so that jQuery
			// will bind to the event using DOM methods.
			if ( $.support.orientation ) { return false; }
			
			// Get the current orientation to avoid initial double-triggering.
			last_orientation = get_orientation();
			
			// Because the orientationchange event doesn't exist, simulate the
			// event by testing window dimensions on resize.
			win.bind( "resize", handler );
		},
		teardown: function(){
			// If the event is not supported natively, return false so that
			// jQuery will unbind the event using DOM methods.
			if ( $.support.orientation ) { return false; }
			
			// Because the orientationchange event doesn't exist, unbind the
			// resize event handler.
			win.unbind( "resize", handler );
		},
		add: function( handleObj ) {
			// Save a reference to the bound event handler.
			var old_handler = handleObj.handler;
			
			handleObj.handler = function( event ) {
				// Modify event object, adding the .orientation property.
				event.orientation = get_orientation();
				
				// Call the originally-bound event handler and return its result.
				return old_handler.apply( this, arguments );
			};
		}
	};
	
	// If the event is not supported natively, this handler will be bound to
	// the window resize event to simulate the orientationchange event.
	function handler() {
		// Get the current orientation.
		var orientation = get_orientation();
		
		if ( orientation !== last_orientation ) {
			// The orientation has changed, so trigger the orientationchange event.
			last_orientation = orientation;
			win.trigger( "orientationchange" );
		}
	};
	
	// Get the current page orientation. This method is exposed publicly, should it
	// be needed, as jQuery.event.special.orientationchange.orientation()
	special_event.orientation = get_orientation = function() {
		var elem = document.documentElement;
		return elem && elem.clientWidth / elem.clientHeight < 1.1 ? "portrait" : "landscape";
	};
	
})(jQuery);

$.each({
	scrollstop: "scrollstart",
	taphold: "tap",
	swipeleft: "swipe",
	swiperight: "swipe"
}, function( event, sourceEvent ) {
	$.event.special[ event ] = {
		setup: function() {
			$( this ).bind( sourceEvent, $.noop );
		}
	};
});

})( jQuery );
/*!
 * jQuery hashchange event - v1.3 - 7/21/2010
 * http://benalman.com/projects/jquery-hashchange-plugin/
 * 
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */

// Script: jQuery hashchange event
//
// *Version: 1.3, Last updated: 7/21/2010*
// 
// Project Home - http://benalman.com/projects/jquery-hashchange-plugin/
// GitHub       - http://github.com/cowboy/jquery-hashchange/
// Source       - http://github.com/cowboy/jquery-hashchange/raw/master/jquery.ba-hashchange.js
// (Minified)   - http://github.com/cowboy/jquery-hashchange/raw/master/jquery.ba-hashchange.min.js (0.8kb gzipped)
// 
// About: License
// 
// Copyright (c) 2010 "Cowboy" Ben Alman,
// Dual licensed under the MIT and GPL licenses.
// http://benalman.com/about/license/
// 
// About: Examples
// 
// These working examples, complete with fully commented code, illustrate a few
// ways in which this plugin can be used.
// 
// hashchange event - http://benalman.com/code/projects/jquery-hashchange/examples/hashchange/
// document.domain - http://benalman.com/code/projects/jquery-hashchange/examples/document_domain/
// 
// About: Support and Testing
// 
// Information about what version or versions of jQuery this plugin has been
// tested with, what browsers it has been tested in, and where the unit tests
// reside (so you can test it yourself).
// 
// jQuery Versions - 1.2.6, 1.3.2, 1.4.1, 1.4.2
// Browsers Tested - Internet Explorer 6-8, Firefox 2-4, Chrome 5-6, Safari 3.2-5,
//                   Opera 9.6-10.60, iPhone 3.1, Android 1.6-2.2, BlackBerry 4.6-5.
// Unit Tests      - http://benalman.com/code/projects/jquery-hashchange/unit/
// 
// About: Known issues
// 
// While this jQuery hashchange event implementation is quite stable and
// robust, there are a few unfortunate browser bugs surrounding expected
// hashchange event-based behaviors, independent of any JavaScript
// window.onhashchange abstraction. See the following examples for more
// information:
// 
// Chrome: Back Button - http://benalman.com/code/projects/jquery-hashchange/examples/bug-chrome-back-button/
// Firefox: Remote XMLHttpRequest - http://benalman.com/code/projects/jquery-hashchange/examples/bug-firefox-remote-xhr/
// WebKit: Back Button in an Iframe - http://benalman.com/code/projects/jquery-hashchange/examples/bug-webkit-hash-iframe/
// Safari: Back Button from a different domain - http://benalman.com/code/projects/jquery-hashchange/examples/bug-safari-back-from-diff-domain/
// 
// Also note that should a browser natively support the window.onhashchange 
// event, but not report that it does, the fallback polling loop will be used.
// 
// About: Release History
// 
// 1.3   - (7/21/2010) Reorganized IE6/7 Iframe code to make it more
//         "removable" for mobile-only development. Added IE6/7 document.title
//         support. Attempted to make Iframe as hidden as possible by using
//         techniques from http://www.paciellogroup.com/blog/?p=604. Added 
//         support for the "shortcut" format $(window).hashchange( fn ) and
//         $(window).hashchange() like jQuery provides for built-in events.
//         Renamed jQuery.hashchangeDelay to <jQuery.fn.hashchange.delay> and
//         lowered its default value to 50. Added <jQuery.fn.hashchange.domain>
//         and <jQuery.fn.hashchange.src> properties plus document-domain.html
//         file to address access denied issues when setting document.domain in
//         IE6/7.
// 1.2   - (2/11/2010) Fixed a bug where coming back to a page using this plugin
//         from a page on another domain would cause an error in Safari 4. Also,
//         IE6/7 Iframe is now inserted after the body (this actually works),
//         which prevents the page from scrolling when the event is first bound.
//         Event can also now be bound before DOM ready, but it won't be usable
//         before then in IE6/7.
// 1.1   - (1/21/2010) Incorporated document.documentMode test to fix IE8 bug
//         where browser version is incorrectly reported as 8.0, despite
//         inclusion of the X-UA-Compatible IE=EmulateIE7 meta tag.
// 1.0   - (1/9/2010) Initial Release. Broke out the jQuery BBQ event.special
//         window.onhashchange functionality into a separate plugin for users
//         who want just the basic event & back button support, without all the
//         extra awesomeness that BBQ provides. This plugin will be included as
//         part of jQuery BBQ, but also be available separately.

(function($,window,undefined){
  '$:nomunge'; // Used by YUI compressor.
  
  // Reused string.
  var str_hashchange = 'hashchange',
    
    // Method / object references.
    doc = document,
    fake_onhashchange,
    special = $.event.special,
    
    // Does the browser support window.onhashchange? Note that IE8 running in
    // IE7 compatibility mode reports true for 'onhashchange' in window, even
    // though the event isn't supported, so also test document.documentMode.
    doc_mode = doc.documentMode,
    supports_onhashchange = 'on' + str_hashchange in window && ( doc_mode === undefined || doc_mode > 7 );
  
  // Get location.hash (or what you'd expect location.hash to be) sans any
  // leading #. Thanks for making this necessary, Firefox!
  function get_fragment( url ) {
    url = url || location.href;
    return '#' + url.replace( /^[^#]*#?(.*)$/, '$1' );
  };
  
  // Method: jQuery.fn.hashchange
  // 
  // Bind a handler to the window.onhashchange event or trigger all bound
  // window.onhashchange event handlers. This behavior is consistent with
  // jQuery's built-in event handlers.
  // 
  // Usage:
  // 
  // > jQuery(window).hashchange( [ handler ] );
  // 
  // Arguments:
  // 
  //  handler - (Function) Optional handler to be bound to the hashchange
  //    event. This is a "shortcut" for the more verbose form:
  //    jQuery(window).bind( 'hashchange', handler ). If handler is omitted,
  //    all bound window.onhashchange event handlers will be triggered. This
  //    is a shortcut for the more verbose
  //    jQuery(window).trigger( 'hashchange' ). These forms are described in
  //    the <hashchange event> section.
  // 
  // Returns:
  // 
  //  (jQuery) The initial jQuery collection of elements.
  
  // Allow the "shortcut" format $(elem).hashchange( fn ) for binding and
  // $(elem).hashchange() for triggering, like jQuery does for built-in events.
  $.fn[ str_hashchange ] = function( fn ) {
    return fn ? this.bind( str_hashchange, fn ) : this.trigger( str_hashchange );
  };
  
  // Property: jQuery.fn.hashchange.delay
  // 
  // The numeric interval (in milliseconds) at which the <hashchange event>
  // polling loop executes. Defaults to 50.
  
  // Property: jQuery.fn.hashchange.domain
  // 
  // If you're setting document.domain in your JavaScript, and you want hash
  // history to work in IE6/7, not only must this property be set, but you must
  // also set document.domain BEFORE jQuery is loaded into the page. This
  // property is only applicable if you are supporting IE6/7 (or IE8 operating
  // in "IE7 compatibility" mode).
  // 
  // In addition, the <jQuery.fn.hashchange.src> property must be set to the
  // path of the included "document-domain.html" file, which can be renamed or
  // modified if necessary (note that the document.domain specified must be the
  // same in both your main JavaScript as well as in this file).
  // 
  // Usage:
  // 
  // jQuery.fn.hashchange.domain = document.domain;
  
  // Property: jQuery.fn.hashchange.src
  // 
  // If, for some reason, you need to specify an Iframe src file (for example,
  // when setting document.domain as in <jQuery.fn.hashchange.domain>), you can
  // do so using this property. Note that when using this property, history
  // won't be recorded in IE6/7 until the Iframe src file loads. This property
  // is only applicable if you are supporting IE6/7 (or IE8 operating in "IE7
  // compatibility" mode).
  // 
  // Usage:
  // 
  // jQuery.fn.hashchange.src = 'path/to/file.html';
  
  $.fn[ str_hashchange ].delay = 50;
  /*
  $.fn[ str_hashchange ].domain = null;
  $.fn[ str_hashchange ].src = null;
  */
  
  // Event: hashchange event
  // 
  // Fired when location.hash changes. In browsers that support it, the native
  // HTML5 window.onhashchange event is used, otherwise a polling loop is
  // initialized, running every <jQuery.fn.hashchange.delay> milliseconds to
  // see if the hash has changed. In IE6/7 (and IE8 operating in "IE7
  // compatibility" mode), a hidden Iframe is created to allow the back button
  // and hash-based history to work.
  // 
  // Usage as described in <jQuery.fn.hashchange>:
  // 
  // > // Bind an event handler.
  // > jQuery(window).hashchange( function(e) {
  // >   var hash = location.hash;
  // >   ...
  // > });
  // > 
  // > // Manually trigger the event handler.
  // > jQuery(window).hashchange();
  // 
  // A more verbose usage that allows for event namespacing:
  // 
  // > // Bind an event handler.
  // > jQuery(window).bind( 'hashchange', function(e) {
  // >   var hash = location.hash;
  // >   ...
  // > });
  // > 
  // > // Manually trigger the event handler.
  // > jQuery(window).trigger( 'hashchange' );
  // 
  // Additional Notes:
  // 
  // * The polling loop and Iframe are not created until at least one handler
  //   is actually bound to the 'hashchange' event.
  // * If you need the bound handler(s) to execute immediately, in cases where
  //   a location.hash exists on page load, via bookmark or page refresh for
  //   example, use jQuery(window).hashchange() or the more verbose 
  //   jQuery(window).trigger( 'hashchange' ).
  // * The event can be bound before DOM ready, but since it won't be usable
  //   before then in IE6/7 (due to the necessary Iframe), recommended usage is
  //   to bind it inside a DOM ready handler.
  
  // Override existing $.event.special.hashchange methods (allowing this plugin
  // to be defined after jQuery BBQ in BBQ's source code).
  special[ str_hashchange ] = $.extend( special[ str_hashchange ], {
    
    // Called only when the first 'hashchange' event is bound to window.
    setup: function() {
      // If window.onhashchange is supported natively, there's nothing to do..
      if ( supports_onhashchange ) { return false; }
      
      // Otherwise, we need to create our own. And we don't want to call this
      // until the user binds to the event, just in case they never do, since it
      // will create a polling loop and possibly even a hidden Iframe.
      $( fake_onhashchange.start );
    },
    
    // Called only when the last 'hashchange' event is unbound from window.
    teardown: function() {
      // If window.onhashchange is supported natively, there's nothing to do..
      if ( supports_onhashchange ) { return false; }
      
      // Otherwise, we need to stop ours (if possible).
      $( fake_onhashchange.stop );
    }
    
  });
  
  // fake_onhashchange does all the work of triggering the window.onhashchange
  // event for browsers that don't natively support it, including creating a
  // polling loop to watch for hash changes and in IE 6/7 creating a hidden
  // Iframe to enable back and forward.
  fake_onhashchange = (function(){
    var self = {},
      timeout_id,
      
      // Remember the initial hash so it doesn't get triggered immediately.
      last_hash = get_fragment(),
      
      fn_retval = function(val){ return val; },
      history_set = fn_retval,
      history_get = fn_retval;
    
    // Start the polling loop.
    self.start = function() {
      timeout_id || poll();
    };
    
    // Stop the polling loop.
    self.stop = function() {
      timeout_id && clearTimeout( timeout_id );
      timeout_id = undefined;
    };
    
    // This polling loop checks every $.fn.hashchange.delay milliseconds to see
    // if location.hash has changed, and triggers the 'hashchange' event on
    // window when necessary.
    function poll() {
      var hash = get_fragment(),
        history_hash = history_get( last_hash );
      
      if ( hash !== last_hash ) {
        history_set( last_hash = hash, history_hash );
        
        $(window).trigger( str_hashchange );
        
      } else if ( history_hash !== last_hash ) {
        location.href = location.href.replace( /#.*/, '' ) + history_hash;
      }
      
      timeout_id = setTimeout( poll, $.fn[ str_hashchange ].delay );
    };
    
    // vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
    // vvvvvvvvvvvvvvvvvvv REMOVE IF NOT SUPPORTING IE6/7/8 vvvvvvvvvvvvvvvvvvv
    // vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
    $.browser.msie && !supports_onhashchange && (function(){
      // Not only do IE6/7 need the "magical" Iframe treatment, but so does IE8
      // when running in "IE7 compatibility" mode.
      
      var iframe,
        iframe_src;
      
      // When the event is bound and polling starts in IE 6/7, create a hidden
      // Iframe for history handling.
      self.start = function(){
        if ( !iframe ) {
          iframe_src = $.fn[ str_hashchange ].src;
          iframe_src = iframe_src && iframe_src + get_fragment();
          
          // Create hidden Iframe. Attempt to make Iframe as hidden as possible
          // by using techniques from http://www.paciellogroup.com/blog/?p=604.
          iframe = $('<iframe tabindex="-1" title="empty"/>').hide()
            
            // When Iframe has completely loaded, initialize the history and
            // start polling.
            .one( 'load', function(){
              iframe_src || history_set( get_fragment() );
              poll();
            })
            
            // Load Iframe src if specified, otherwise nothing.
            .attr( 'src', iframe_src || 'javascript:0' )
            
            // Append Iframe after the end of the body to prevent unnecessary
            // initial page scrolling (yes, this works).
            .insertAfter( 'body' )[0].contentWindow;
          
          // Whenever `document.title` changes, update the Iframe's title to
          // prettify the back/next history menu entries. Since IE sometimes
          // errors with "Unspecified error" the very first time this is set
          // (yes, very useful) wrap this with a try/catch block.
          doc.onpropertychange = function(){
            try {
              if ( event.propertyName === 'title' ) {
                iframe.document.title = doc.title;
              }
            } catch(e) {}
          };
          
        }
      };
      
      // Override the "stop" method since an IE6/7 Iframe was created. Even
      // if there are no longer any bound event handlers, the polling loop
      // is still necessary for back/next to work at all!
      self.stop = fn_retval;
      
      // Get history by looking at the hidden Iframe's location.hash.
      history_get = function() {
        return get_fragment( iframe.location.href );
      };
      
      // Set a new history item by opening and then closing the Iframe
      // document, *then* setting its location.hash. If document.domain has
      // been set, update that as well.
      history_set = function( hash, history_hash ) {
        var iframe_doc = iframe.document,
          domain = $.fn[ str_hashchange ].domain;
        
        if ( hash !== history_hash ) {
          // Update Iframe with any initial `document.title` that might be set.
          iframe_doc.title = doc.title;
          
          // Opening the Iframe's document after it has been closed is what
          // actually adds a history entry.
          iframe_doc.open();
          
          // Set document.domain for the Iframe document as well, if necessary.
          domain && iframe_doc.write( '<script>document.domain="' + domain + '"</script>' );
          
          iframe_doc.close();
          
          // Update the Iframe's hash, for great justice.
          iframe.location.hash = hash;
        }
      };
      
    })();
    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // ^^^^^^^^^^^^^^^^^^^ REMOVE IF NOT SUPPORTING IE6/7/8 ^^^^^^^^^^^^^^^^^^^
    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    
    return self;
  })();
  
})(jQuery,this);
/*!
 * jQuery Mobile v@VERSION
 * http://jquerymobile.com/
 *
 * Copyright 2010, jQuery Project
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 */

(function( $, window, undefined ) {
	
	//jQuery.mobile configurable options
	$.extend( $.mobile, {
		
		//define the url parameter used for referencing widget-generated sub-pages. 
		//Translates to to example.html&ui-page=subpageIdentifier
		//hash segment before &ui-page= is used to make Ajax request
		subPageUrlKey: 'ui-page',
		
		//anchor links with a data-rel, or pages with a data-role, that match these selectors will be untrackable in history 
		//(no change in URL, not bookmarkable)
		nonHistorySelectors: 'dialog',
		
		//class assigned to page currently in view, and during transitions
		activePageClass: 'ui-page-active',
		
		//class used for "active" button state, from CSS framework
		activeBtnClass: 'ui-btn-active',
		
		//automatically handle link clicks through Ajax, when possible
		ajaxLinksEnabled: true,
		
		//automatically handle form submissions through Ajax, when possible
		ajaxFormsEnabled: true,
		
		//set default transition - 'none' for no transitions
		defaultTransition: 'slide',
		
		//show loading message during Ajax requests
		//if false, message will not appear, but loading classes will still be toggled on html el
		loadingMessage: "loading",
		
		//configure meta viewport tag's content attr:
		metaViewportContent: "width=device-width, minimum-scale=1, maximum-scale=1",
		
		//support conditions that must be met in order to proceed
		gradeA: function(){
			return $.support.mediaquery;
		}
	});
	
	
//trigger mobileinit event - useful hook for configuring $.mobile settings before they're used
	$( window.document ).trigger('mobileinit');


//support conditions	
	//if device support condition(s) aren't met, leave things as they are -> a basic, usable experience,
	//otherwise, proceed with the enhancements
	if ( !$.mobile.gradeA() ) {
		return;
	}	


//define vars for interal use
	var $window = $(window),
		$html = $('html'),
		$head = $('head'),
		
		//loading div which appears during Ajax requests
		//will not appear if $.mobile.loadingMessage is false
		$loader = $.mobile.loadingMessage ? 
			$('<div class="ui-loader ui-body-a ui-corner-all">'+
						'<span class="ui-icon ui-icon-loading spin"></span>'+
						'<h1>'+ $.mobile.loadingMessage +'</h1>'+
					'</div>')
			: undefined;


//add mobile, initial load "rendering" classes to docEl
	$html.addClass('ui-mobile ui-mobile-rendering');			
		
			
//define & prepend meta viewport tag, if content is defined	
	$.mobile.metaViewportContent ? $("<meta>", { name: "viewport", content: $.mobile.metaViewportContent}).prependTo( $head ) : undefined;			

	
//expose some core utilities
	$.extend($.mobile, {
	
		// turn on/off page loading message.
		pageLoading: function ( done ) {
			if ( done ) {
				$html.removeClass( "ui-loading" );
			} else {
				if( $.mobile.loadingMessage ){
					$loader.appendTo($.mobile.pageContainer).css({top: $(window).scrollTop() + 75});
				}	
				$html.addClass( "ui-loading" );
			}
		},
		
		//scroll page vertically: scroll to 0 to hide iOS address bar, or pass a Y value
		silentScroll: function( ypos ) {
			// prevent scrollstart and scrollstop events
			$.event.special.scrollstart.enabled = false;
			setTimeout(function() {
				window.scrollTo( 0, ypos || 0 );
			},20);	
			setTimeout(function() {
				$.event.special.scrollstart.enabled = true;
			}, 150 );
		}
	});	
	
	
//dom-ready inits
	$(function(){
		
		//find present pages		
		var $pages = $("[data-role='page']");
		
		$pages.each(function(){
			$(this).attr('data-url', $(this).attr('id'));
		});
		
		//set up active page
		$.mobile.startPage = $.mobile.activePage = $pages.first();
		
		//set page container
		$.mobile.pageContainer = $.mobile.startPage.parent().addClass('ui-mobile-viewport');
		
		//cue page loading message
		$.mobile.pageLoading();
		
		//initialize all pages present
		$pages.page();
		
		//trigger a new hashchange, hash or not
		$window.trigger( "hashchange", [ true ] );
		
		//remove rendering class
		$html.removeClass('ui-mobile-rendering');
	});
	
	
//window load event	
	//hide iOS browser chrome on load
	$window.load( $.mobile.silentScroll );	
	
})( jQuery, this );
/*
* jQuery Mobile Framework : core utilities for auto ajax navigation, base tag mgmt,
* Copyright (c) jQuery Project
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*/
(function($, undefined ) {

	//define vars for interal use
	var $window = $(window),
		$html = $('html'),
		$head = $('head'),

		//url path helpers for use in relative url management
		path = {

			//get path from current hash, or from a file path
			get: function( newPath ){
				if( newPath == undefined ){
					newPath = location.hash;
				}
				newPath = newPath.replace(/#/,'').split('/');
				if(newPath.length){
					var lastSegment = newPath[newPath.length-1];
					if( lastSegment.indexOf('.') > -1 || lastSegment == ''){
						newPath.pop();
					}
				}
				return newPath.join('/') + (newPath.length ? '/' : '');
			},

			//return the substring of a filepath before the sub-page key, for making a server request
			getFilePath: function( path ){
				var splitkey = '&' + $.mobile.subPageUrlKey;
				return path && path.indexOf( splitkey ) > -1 ? path.split( splitkey )[0] : path;
			},

			set: function( path, disableListening){
				if(disableListening) { hashListener = false; }
				location.hash = path;
			},

			//location pathname from intial directory request
			origin: '',

			setOrigin: function(){
				path.origin = path.get( location.protocol + '//' + location.host + location.pathname );
			}
		},

		//base element management, defined depending on dynamic base tag support
		base = $.support.dynamicBaseTag ? {

			//define base element, for use in routing asset urls that are referenced in Ajax-requested markup
			element: $("<base>", { href: path.origin }).prependTo( $head ),

			//set the generated BASE element's href attribute to a new page's base path
			set: function( href ){
				base.element.attr('href', path.origin + path.get( href ));
			},

			//set the generated BASE element's href attribute to a new page's base path
			reset: function(){
				base.element.attr('href', path.origin );
			}

		} : undefined,


		//will be defined when a link is clicked and given an active class
		$activeClickedLink = null,

		//array of pages that are visited during a single page load
		//length will grow as pages are visited, and shrink as "back" link/button is clicked
		//each item has a url (string matches ID), and transition (saved for reuse when "back" link/button is clicked)
		urlStack = [ {
			url: location.hash.replace( /^#/, "" ),
			transition: undefined
		} ],

		//define first selector to receive focus when a page is shown
		focusable = "[tabindex],a,button:visible,select:visible,input",

		//contains role for next page, if defined on clicked link via data-rel
		nextPageRole = null,

		//enable/disable hashchange event listener
		//toggled internally when location.hash is updated to match the url of a successful page load
		hashListener = true;

		//set location pathname from intial directory request
		path.setOrigin();

/*
	internal utility functions
--------------------------------------*/


	//direct focus to the page title, or otherwise first focusable element
	function reFocus( page ){
		var pageTitle = page.find( ".ui-title:eq(0)" );
		if( pageTitle.length ){
			pageTitle.focus();
		}
		else{
			page.find( focusable ).eq(0).focus();
		}
	};

	//remove active classes after page transition or error
	function removeActiveLinkClass( forceRemoval ){
		if( !!$activeClickedLink && (!$activeClickedLink.closest( '.ui-page-active' ).length || forceRemoval )){
			$activeClickedLink.removeClass( $.mobile.activeBtnClass );
		}
		$activeClickedLink = null;
	};


	//animation complete callback
	$.fn.animationComplete = function( callback ){
		if($.support.cssTransitions){
			return $(this).one('webkitAnimationEnd', callback);
		}
		else{
			callback();
		}
	};



/* exposed $.mobile methods	 */

	//update location.hash, with or without triggering hashchange event
	$.mobile.updateHash = path.set;

	//url stack, useful when plugins need to be aware of previous pages viewed
	$.mobile.urlStack = urlStack;

	// changepage function
	$.mobile.changePage = function( to, transition, back, changeHash){

		//from is always the currently viewed page
		var toIsArray = $.type(to) === "array",
			from = toIsArray ? to[0] : $.mobile.activePage,
			to = toIsArray ? to[1] : to,
			url = fileUrl = $.type(to) === "string" ? to.replace( /^#/, "" ) : null,
			data = undefined,
			type = 'get',
			isFormRequest = false,
			duplicateCachedPage = null,
			back = (back !== undefined) ? back : ( urlStack.length > 1 && urlStack[ urlStack.length - 2 ].url === url );

		//If we are trying to transition to the same page that we are currently on ignore the request.
		if(urlStack.length > 1 && url === urlStack[urlStack.length -1].url && !toIsArray ) {
			return;
		}

		if( $.type(to) === "object" && to.url ){
			url = to.url,
			data = to.data,
			type = to.type,
			isFormRequest = true;
			//make get requests bookmarkable
			if( data && type == 'get' ){
				url += "?" + data;
				data = undefined;
			}
		}

		//reset base to pathname for new request
		if(base){ base.reset(); }

		//kill the keyboard
		$( window.document.activeElement ).add(':focus').blur();

		function defaultTransition(){
			if(transition === undefined){
				transition = $.mobile.defaultTransition;
			}
		}

		// if the new href is the same as the previous one
		if ( back ) {
			var pop = urlStack.pop();

			// prefer the explicitly set transition
			if( pop && !transition ){
				transition = pop.transition;
			}

			// ensure a transition has been set where pop is undefined
			defaultTransition();
		} else {
			// If no transition has been passed
			defaultTransition();

			// push the url and transition onto the stack
			urlStack.push({ url: url, transition: transition });
		}

		//function for transitioning between two existing pages
		function transitionPages() {

			//get current scroll distance
			var currScroll = $window.scrollTop(),
					perspectiveTransitions = ["flip"],
					pageContainerClasses = [];

			//set as data for returning to that spot
			from.data('lastScroll', currScroll);

			//trigger before show/hide events
			from.data("page")._trigger("beforehide", {nextPage: to});
			to.data("page")._trigger("beforeshow", {prevPage: from});

			function loadComplete(){
				$.mobile.pageLoading( true );

				reFocus( to );

				if( changeHash !== false && url ){
					path.set(url, (back !== true));
				}
				removeActiveLinkClass();

				//if there's a duplicateCachedPage, remove it from the DOM now that it's hidden
				if( duplicateCachedPage != null ){
					duplicateCachedPage.remove();
				}

				//jump to top or prev scroll, if set
				$.mobile.silentScroll( to.data( 'lastScroll' ) );

				//trigger show/hide events, allow preventing focus change through return false
				from.data("page")._trigger("hide", null, {nextPage: to});
				if( to.data("page")._trigger("show", null, {prevPage: from}) !== false ){
					$.mobile.activePage = to;
				}
			};

			function addContainerClass(className){
				$.mobile.pageContainer.addClass(className);
				pageContainerClasses.push(className);
			};

			function removeContainerClasses(){
				$.mobile
					.pageContainer
					.removeClass(pageContainerClasses.join(" "));

				pageContainerClasses = [];
			};

			if(transition && (transition !== 'none')){
				if( perspectiveTransitions.indexOf(transition) >= 0 ){
					addContainerClass('ui-mobile-viewport-perspective');
				}

				addContainerClass('ui-mobile-viewport-transitioning');

				// animate in / out
				from.addClass( transition + " out " + ( back ? "reverse" : "" ) );
				to.addClass( $.mobile.activePageClass + " " + transition +
					" in " + ( back ? "reverse" : "" ) );

				// callback - remove classes, etc
				to.animationComplete(function() {
					from.add( to ).removeClass("out in reverse " + transition );
					from.removeClass( $.mobile.activePageClass );
					loadComplete();
					removeContainerClasses();
				});
			}
			else{
				from.removeClass( $.mobile.activePageClass );
				to.addClass( $.mobile.activePageClass );
				loadComplete();
			}
		};

		//shared page enhancements
		function enhancePage(){

			//set next page role, if defined
			if ( nextPageRole || to.data('role') == 'dialog' ) {
				changeHash = false;
				if(nextPageRole){
					to.attr( "data-role", nextPageRole );
					nextPageRole = null;
				}
			}

			//run page plugin
			to.page();
		};

		//if url is a string
		if( url ){
			to = $( "[data-url='" + url + "']" );
			fileUrl = path.getFilePath(url);
		}
		else{ //find base url of element, if avail
			var toID = to.attr('data-url'),
				toIDfileurl = path.getFilePath(toID);

			if(toID != toIDfileurl){
				fileUrl = toIDfileurl;
			}
		}

		// find the "to" page, either locally existing in the dom or by creating it through ajax
		if ( to.length && !isFormRequest ) {
			if( fileUrl && base ){
				base.set( fileUrl );
			}
			enhancePage();
			transitionPages();
		} else {

			//if to exists in DOM, save a reference to it in duplicateCachedPage for removal after page change
			if( to.length ){
				duplicateCachedPage = to;
			}

			$.mobile.pageLoading();

			$.ajax({
				url: fileUrl,
				type: type,
				data: data,
				success: function( html ) {
					if(base){ base.set(fileUrl); }

					var all = $("<div></div>");
					//workaround to allow scripts to execute when included in page divs
					all.get(0).innerHTML = html;
					to = all.find('[data-role="page"], [data-role="dialog"]').first();

					//rewrite src and href attrs to use a base url
					if( !$.support.dynamicBaseTag ){
						var newPath = path.get( fileUrl );
						to.find('[src],link[href]').each(function(){
							var thisAttr = $(this).is('[href]') ? 'href' : 'src',
								thisUrl = $(this).attr(thisAttr);

							//if full path exists and is same, chop it - helps IE out
							thisUrl.replace( location.protocol + '//' + location.host + location.pathname, '' );

							if( !/^(\w+:|#|\/)/.test(thisUrl) ){
								$(this).attr(thisAttr, newPath + thisUrl);
							}
						});
					}

					to
						.attr( "data-url", fileUrl )
						.appendTo( $.mobile.pageContainer );

					enhancePage();
					transitionPages();
				},
				error: function() {
					$.mobile.pageLoading( true );
					removeActiveLinkClass(true);
					base.set(path.get());
					$("<div class='ui-loader ui-overlay-shadow ui-body-e ui-corner-all'><h1>Error Loading Page</h1></div>")
						.css({ "display": "block", "opacity": 0.96, "top": $(window).scrollTop() + 100 })
						.appendTo( $.mobile.pageContainer )
						.delay( 800 )
						.fadeOut( 400, function(){
							$(this).remove();
						});
				}
			});
		}

	};


/* Event Bindings - hashchange, submit, and click */

	//bind to form submit events, handle with Ajax
	$('form').live('submit', function(event){
		if( !$.mobile.ajaxFormsEnabled ){ return; }

		var type = $(this).attr("method"),
			url = $(this).attr( "action" ).replace( location.protocol + "//" + location.host, "");

		//external submits use regular HTTP
		if( /^(:?\w+:)/.test( url ) ){
			return;
		}

		//if it's a relative href, prefix href with base url
		if( url.indexOf('/') && url.indexOf('#') !== 0 ){
			url = path.get() + url;
		}

		$.mobile.changePage({
				url: url,
				type: type,
				data: $(this).serialize()
			},
			undefined,
			undefined,
			true
		);
		event.preventDefault();
	});


	//click routing - direct to HTTP or Ajax, accordingly
	$( "a" ).live( "click", function(event) {

		if( !$.mobile.ajaxLinksEnabled ){ return; }
		var $this = $(this),
			//get href, remove same-domain protocol and host
			href = $this.attr( "href" ).replace( location.protocol + "//" + location.host, ""),
			//if target attr is specified, it's external, and we mimic _blank... for now
			target = $this.is( "[target]" ),
			//if it still starts with a protocol, it's external, or could be :mailto, etc
			external = target || /^(:?\w+:)/.test( href ) || $this.is( "[rel=external]" );

		if( href === '#' ){
			//for links created purely for interaction - ignore
			return false;
		}

		$activeClickedLink = $this.closest( ".ui-btn" ).addClass( $.mobile.activeBtnClass );

		if( external || !$.mobile.ajaxLinksEnabled ){
			//remove active link class if external
			removeActiveLinkClass(true);

			//deliberately redirect, in case click was triggered
			if( target ){
				window.open(href);
			}
			else{
				location.href = href;
			}
		}
		else {
			//use ajax
			var transition = $this.data( "transition" ),
				back = $this.data( "back" );

			nextPageRole = $this.attr( "data-rel" );

			//if it's a relative href, prefix href with base url
			if( href.indexOf('/') && href.indexOf('#') !== 0 ){
				href = path.get() + href;
			}

			href.replace(/^#/,'');

			$.mobile.changePage(href, transition, back);
		}
		event.preventDefault();
	});



	//hashchange event handler
	$window.bind( "hashchange", function(e, triggered) {
		if( !hashListener ){
			hashListener = true;
			return;
		}

		if( $(".ui-page-active").is("[data-role=" + $.mobile.nonHistorySelectors + "]") ){
			return;
		}

		var to = location.hash,
			transition = triggered ? false : undefined;

		//if to is defined, use it
		if ( to ){
			$.mobile.changePage( to, transition, undefined, false);
		}
		//there's no hash, the active page is not the start page, and it's not manually triggered hashchange
		//we probably backed out to the first page visited
		else if( $.mobile.activePage.length && $.mobile.startPage[0] !== $.mobile.activePage[0] && !triggered ) {
			$.mobile.changePage( $.mobile.startPage, transition, true, false );
		}
		//probably the first page - show it
		else{
			$.mobile.startPage.trigger("pagebeforeshow", {prevPage: $('')});
			$.mobile.startPage.addClass( $.mobile.activePageClass );
			$.mobile.pageLoading( true );

			if( $.mobile.startPage.trigger("pageshow", {prevPage: $('')}) !== false ){
				reFocus($.mobile.startPage);
			}
		}
	});
})( jQuery );/*
* jQuery Mobile Framework : "page" plugin
* Copyright (c) jQuery Project
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*/
(function($, undefined ) {

$.widget( "mobile.page", $.mobile.widget, {
	options: {
		backBtnText: "Back",
		addBackBtn: true,
		degradeInputs: {
			color: false,
			date: false,
			datetime: false,
			"datetime-local": false,
			email: false,
			month: false,
			number: false,
			range: "number",
			search: true,
			tel: false,
			time: false,
			url: false,
			week: false
		},
		keepNative: null
	},

	_create: function() {
		var $elem = this.element,
			o = this.options;

		this.keepNative = "[data-role='none'], [data-role='nojs']" + (o.keepNative ? ", " + o.keepNative : "");

		if ( this._trigger( "beforeCreate" ) === false ) {
			return;
		}

		//some of the form elements currently rely on the presence of ui-page and ui-content
		// classes so we'll handle page and content roles outside of the main role processing
		// loop below.
		$elem.find( "[data-role='page'], [data-role='content']" ).andSelf().each(function() {
			$(this).addClass( "ui-" + $(this).data( "role" ) );
		});

		$elem.find( "[data-role='nojs']" ).addClass( "ui-nojs" );

		this._enchanceControls();

		// pre-find data els
		var $dataEls = $elem.find( "[data-role]" ).andSelf().each(function() {
			var $this = $( this ),
				role = $this.data( "role" ),
				theme = $this.data( "theme" );

			//apply theming and markup modifications to page,header,content,footer
			if ( role === "header" || role === "footer" ) {
				$this.addClass( "ui-bar-" + (theme || $this.parent('[data-role=page]').data( "theme" ) || "a") );

				// add ARIA role
				$this.attr( "role", role === "header" ? "banner" : "contentinfo" );

				//right,left buttons
				var $headeranchors = $this.children( "a" ),
					leftbtn = $headeranchors.hasClass( "ui-btn-left" ),
					rightbtn = $headeranchors.hasClass( "ui-btn-right" );

				if ( !leftbtn ) {
					leftbtn = $headeranchors.eq( 0 ).not( ".ui-btn-right" ).addClass( "ui-btn-left" ).length;
				}

				if ( !rightbtn ) {
					rightbtn = $headeranchors.eq( 1 ).addClass( "ui-btn-right" ).length;
				}

				// auto-add back btn on pages beyond first view
				if ( o.addBackBtn && role === "header" &&
						($.mobile.urlStack.length > 1 || $(".ui-page").length > 1) &&
						!leftbtn && !$this.data( "noBackBtn" ) ) {

					$( "<a href='#' class='ui-btn-left' data-icon='arrow-l'>"+ o.backBtnText +"</a>" )
						.click(function() {
							history.back();
							return false;
						})
						.prependTo( $this );
				}

				//page title
				$this.children( "h1, h2, h3, h4, h5, h6" )
					.addClass( "ui-title" )
					//regardless of h element number in src, it becomes h1 for the enhanced page
					.attr({ "tabindex": "0", "role": "heading", "aria-level": "1" });

			} else if ( role === "content" ) {
				if ( theme ) {
					$this.addClass( "ui-body-" + theme );
				}

				// add ARIA role
				$this.attr( "role", "main" );

			} else if ( role === "page" ) {
				$this.addClass( "ui-body-" + (theme || "c") );
			}

			switch(role) {
				case "header":
				case "footer":
				case "page":
				case "content":
					$this.addClass( "ui-" + role );
					break;
				case "collapsible":
				case "fieldcontain":
				case "navbar":
				case "listview":
				case "dialog":
					$this[ role ]();
					break;
			}
		});

		//links in bars, or those with data-role become buttons
		$elem.find( "[data-role='button'], .ui-bar > a, .ui-header > a, .ui-footer > a" )
			.not( ".ui-btn" )
			.not(this.keepNative)
			.buttonMarkup();

		$elem
			.find("[data-role='controlgroup']")
			.controlgroup();

		//links within content areas
		$elem.find( "a:not(.ui-btn):not(.ui-link-inherit)" )
			.not(this.keepNative)
			.addClass( "ui-link" );

		//fix toolbars
		$elem.fixHeaderFooter();
	},

	_enchanceControls: function() {
		var o = this.options;

		// degrade inputs to avoid poorly implemented native functionality
		this.element.find( "input" ).not(this.keepNative).each(function() {
			var type = this.getAttribute( "type" ),
				optType = o.degradeInputs[ type ] || "text";

			if ( o.degradeInputs[ type ] ) {
				$( this ).replaceWith(
					$( "<div>" ).html( $(this).clone() ).html()
						.replace( /type="([a-zA-Z]+)"/, "type="+ optType +" data-type='$1'" ) );
			}
		});

		// enchance form controls
		this.element
			.find( "[type='radio'], [type='checkbox']" )
			.not(this.keepNative)
			.checkboxradio();

		this.element
			.find( "button, [type='button'], [type='submit'], [type='reset'], [type='image']" )
			.not(this.keepNative)
			.button();

		this.element
			.find( "input, textarea" )
			.not( "[type='radio'], [type='checkbox'], button, [type='button'], [type='submit'], [type='reset'], [type='image']" )
			.not(this.keepNative)
			.textinput();

		this.element
			.find( "input, select" )
			.not(this.keepNative)
			.filter( "[data-role='slider'], [data-type='range']" )
			.slider();

		this.element
			.find( "select:not([data-role='slider'])" )
			.not(this.keepNative)
			.selectmenu();
	}
});

})( jQuery );
/*
 * jQuery UI Position @VERSION
 *
 * Copyright 2010, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Position
 */
(function( $, undefined ) {

$.ui = $.ui || {};

var horizontalPositions = /left|center|right/,
	verticalPositions = /top|center|bottom/,
	center = "center",
	_position = $.fn.position,
	_offset = $.fn.offset;

$.fn.position = function( options ) {
	if ( !options || !options.of ) {
		return _position.apply( this, arguments );
	}

	// make a copy, we don't want to modify arguments
	options = $.extend( {}, options );

	var target = $( options.of ),
		targetElem = target[0],
		collision = ( options.collision || "flip" ).split( " " ),
		offset = options.offset ? options.offset.split( " " ) : [ 0, 0 ],
		targetWidth,
		targetHeight,
		basePosition;

	if ( targetElem.nodeType === 9 ) {
		targetWidth = target.width();
		targetHeight = target.height();
		basePosition = { top: 0, left: 0 };
	// TODO: use $.isWindow() in 1.9
	} else if ( targetElem.setTimeout ) {
		targetWidth = target.width();
		targetHeight = target.height();
		basePosition = { top: target.scrollTop(), left: target.scrollLeft() };
	} else if ( targetElem.preventDefault ) {
		// force left top to allow flipping
		options.at = "left top";
		targetWidth = targetHeight = 0;
		basePosition = { top: options.of.pageY, left: options.of.pageX };
	} else {
		targetWidth = target.outerWidth();
		targetHeight = target.outerHeight();
		basePosition = target.offset();
	}

	// force my and at to have valid horizontal and veritcal positions
	// if a value is missing or invalid, it will be converted to center 
	$.each( [ "my", "at" ], function() {
		var pos = ( options[this] || "" ).split( " " );
		if ( pos.length === 1) {
			pos = horizontalPositions.test( pos[0] ) ?
				pos.concat( [center] ) :
				verticalPositions.test( pos[0] ) ?
					[ center ].concat( pos ) :
					[ center, center ];
		}
		pos[ 0 ] = horizontalPositions.test( pos[0] ) ? pos[ 0 ] : center;
		pos[ 1 ] = verticalPositions.test( pos[1] ) ? pos[ 1 ] : center;
		options[ this ] = pos;
	});

	// normalize collision option
	if ( collision.length === 1 ) {
		collision[ 1 ] = collision[ 0 ];
	}

	// normalize offset option
	offset[ 0 ] = parseInt( offset[0], 10 ) || 0;
	if ( offset.length === 1 ) {
		offset[ 1 ] = offset[ 0 ];
	}
	offset[ 1 ] = parseInt( offset[1], 10 ) || 0;

	if ( options.at[0] === "right" ) {
		basePosition.left += targetWidth;
	} else if (options.at[0] === center ) {
		basePosition.left += targetWidth / 2;
	}

	if ( options.at[1] === "bottom" ) {
		basePosition.top += targetHeight;
	} else if ( options.at[1] === center ) {
		basePosition.top += targetHeight / 2;
	}

	basePosition.left += offset[ 0 ];
	basePosition.top += offset[ 1 ];

	return this.each(function() {
		var elem = $( this ),
			elemWidth = elem.outerWidth(),
			elemHeight = elem.outerHeight(),
			marginLeft = parseInt( $.curCSS( this, "marginLeft", true ) ) || 0,
			marginTop = parseInt( $.curCSS( this, "marginTop", true ) ) || 0,
			collisionWidth = elemWidth + marginLeft +
				parseInt( $.curCSS( this, "marginRight", true ) ) || 0,
			collisionHeight = elemHeight + marginTop +
				parseInt( $.curCSS( this, "marginBottom", true ) ) || 0,
			position = $.extend( {}, basePosition ),
			collisionPosition;

		if ( options.my[0] === "right" ) {
			position.left -= elemWidth;
		} else if ( options.my[0] === center ) {
			position.left -= elemWidth / 2;
		}

		if ( options.my[1] === "bottom" ) {
			position.top -= elemHeight;
		} else if ( options.my[1] === center ) {
			position.top -= elemHeight / 2;
		}

		// prevent fractions (see #5280)
		position.left = parseInt( position.left );
		position.top = parseInt( position.top );

		collisionPosition = {
			left: position.left - marginLeft,
			top: position.top - marginTop
		};

		$.each( [ "left", "top" ], function( i, dir ) {
			if ( $.ui.position[ collision[i] ] ) {
				$.ui.position[ collision[i] ][ dir ]( position, {
					targetWidth: targetWidth,
					targetHeight: targetHeight,
					elemWidth: elemWidth,
					elemHeight: elemHeight,
					collisionPosition: collisionPosition,
					collisionWidth: collisionWidth,
					collisionHeight: collisionHeight,
					offset: offset,
					my: options.my,
					at: options.at
				});
			}
		});

		if ( $.fn.bgiframe ) {
			elem.bgiframe();
		}
		elem.offset( $.extend( position, { using: options.using } ) );
	});
};

$.ui.position = {
	fit: {
		left: function( position, data ) {
			var win = $( window ),
				over = data.collisionPosition.left + data.collisionWidth - win.width() - win.scrollLeft();
			position.left = over > 0 ? position.left - over : Math.max( position.left - data.collisionPosition.left, position.left );
		},
		top: function( position, data ) {
			var win = $( window ),
				over = data.collisionPosition.top + data.collisionHeight - win.height() - win.scrollTop();
			position.top = over > 0 ? position.top - over : Math.max( position.top - data.collisionPosition.top, position.top );
		}
	},

	flip: {
		left: function( position, data ) {
			if ( data.at[0] === center ) {
				return;
			}
			var win = $( window ),
				over = data.collisionPosition.left + data.collisionWidth - win.width() - win.scrollLeft(),
				myOffset = data.my[ 0 ] === "left" ?
					-data.elemWidth :
					data.my[ 0 ] === "right" ?
						data.elemWidth :
						0,
				atOffset = data.at[ 0 ] === "left" ?
					data.targetWidth :
					-data.targetWidth,
				offset = -2 * data.offset[ 0 ];
			position.left += data.collisionPosition.left < 0 ?
				myOffset + atOffset + offset :
				over > 0 ?
					myOffset + atOffset + offset :
					0;
		},
		top: function( position, data ) {
			if ( data.at[1] === center ) {
				return;
			}
			var win = $( window ),
				over = data.collisionPosition.top + data.collisionHeight - win.height() - win.scrollTop(),
				myOffset = data.my[ 1 ] === "top" ?
					-data.elemHeight :
					data.my[ 1 ] === "bottom" ?
						data.elemHeight :
						0,
				atOffset = data.at[ 1 ] === "top" ?
					data.targetHeight :
					-data.targetHeight,
				offset = -2 * data.offset[ 1 ];
			position.top += data.collisionPosition.top < 0 ?
				myOffset + atOffset + offset :
				over > 0 ?
					myOffset + atOffset + offset :
					0;
		}
	}
};

// offset setter from jQuery 1.4
if ( !$.offset.setOffset ) {
	$.offset.setOffset = function( elem, options ) {
		// set position first, in-case top/left are set even on static elem
		if ( /static/.test( $.curCSS( elem, "position" ) ) ) {
			elem.style.position = "relative";
		}
		var curElem   = $( elem ),
			curOffset = curElem.offset(),
			curTop    = parseInt( $.curCSS( elem, "top",  true ), 10 ) || 0,
			curLeft   = parseInt( $.curCSS( elem, "left", true ), 10)  || 0,
			props     = {
				top:  (options.top  - curOffset.top)  + curTop,
				left: (options.left - curOffset.left) + curLeft
			};
		
		if ( 'using' in options ) {
			options.using.call( elem, props );
		} else {
			curElem.css( props );
		}
	};

	$.fn.offset = function( options ) {
		var elem = this[ 0 ];
		if ( !elem || !elem.ownerDocument ) { return null; }
		if ( options ) { 
			return this.each(function() {
				$.offset.setOffset( this, options );
			});
		}
		return _offset.call( this );
	};
}

}( jQuery ));/*
* jQuery Mobile Framework : "fixHeaderFooter" plugin - on-demand positioning for headers,footers
* Copyright (c) jQuery Project
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*/
(function($, undefined ) {
$.fn.fixHeaderFooter = function(options){
	if( !$.support.scrollTop ){ return $(this); }
	return $(this).each(function(){
		if( $(this).data('fullscreen') ){ $(this).addClass('ui-page-fullscreen'); }
		$(this).find('.ui-header[data-position="fixed"]').addClass('ui-header-fixed ui-fixed-inline fade'); //should be slidedown
		$(this).find('.ui-footer[data-position="fixed"]').addClass('ui-footer-fixed ui-fixed-inline fade'); //should be slideup		
	});
};				

//single controller for all showing,hiding,toggling		
$.fixedToolbars = (function(){
	if( !$.support.scrollTop ){ return; }
	var currentstate = 'inline',
		delayTimer,
		ignoreTargets = 'a,input,textarea,select,button,label,.ui-header-fixed,.ui-footer-fixed',
		toolbarSelector = '.ui-header-fixed:first, .ui-footer-fixed:not(.ui-footer-duplicate):last',
		stickyFooter, //for storing quick references to duplicate footers
		supportTouch = $.support.touch,
		touchStartEvent = supportTouch ? "touchstart" : "mousedown",
		touchStopEvent = supportTouch ? "touchend" : "mouseup",
		stateBefore = null,
		scrollTriggered = false,
        touchToggleEnabled = true;

	$(function() {
		$(document)
			.bind(touchStartEvent,function(event){
				if( touchToggleEnabled ) {
					if( $(event.target).closest(ignoreTargets).length ){ return; }
					stateBefore = currentstate;
				}
			})
			.bind('scrollstart',function(event){
				if( $(event.target).closest(ignoreTargets).length ){ return; } //because it could be a touchmove...
				scrollTriggered = true;
				if(stateBefore == null){ stateBefore = currentstate; }
				if (stateBefore == 'overlay') {
					$.fixedToolbars.hide(true);
				}
			})
			.bind(touchStopEvent,function(event){
				if( touchToggleEnabled ) {
					if( $(event.target).closest(ignoreTargets).length ){ return; }
					if( !scrollTriggered ){
						$.fixedToolbars.toggle(stateBefore);
						stateBefore = null;
					}
				}
			})
			.bind('scrollstop',function(event){
				if( $(event.target).closest(ignoreTargets).length ){ return; }
				scrollTriggered = false;
				if (stateBefore == 'overlay') {
					$.fixedToolbars.show();
				}
				stateBefore = null;
			});
		
		//function to return another footer already in the dom with the same data-id
		function findStickyFooter(el){
			var thisFooter = el.find('[data-role="footer"]');
			return $( '.ui-footer[data-id="'+ thisFooter.data('id') +'"]:not(.ui-footer-duplicate)' ).not(thisFooter);
		}
		
		//before page is shown, check for duplicate footer
		$('.ui-page').live('pagebeforeshow', function(event, ui){
			stickyFooter = findStickyFooter( $(event.target) );
			if( stickyFooter.length ){
				//if the existing footer is the first of its kind, create a placeholder before stealing it 
				if( stickyFooter.parents('.ui-page:eq(0)').find('.ui-footer[data-id="'+ stickyFooter.data('id') +'"]').length == 1 ){
					stickyFooter.before( stickyFooter.clone().addClass('ui-footer-duplicate') );
				}
				$(event.target).find('[data-role="footer"]').addClass('ui-footer-duplicate');
				stickyFooter.appendTo($.pageContainer).css('top',0);
				setTop(stickyFooter);
			}
		});

		//after page is shown, append footer to new page
		$('.ui-page').live('pageshow', function(event, ui){
			if( stickyFooter && stickyFooter.length ){
				stickyFooter.appendTo(event.target).css('top',0);
			}
			$.fixedToolbars.show(true, this);
		});
		
	});
	
	// element.getBoundingClientRect() is broken in iOS 3.2.1 on the iPad. The
	// coordinates inside of the rect it returns don't have the page scroll position
	// factored out of it like the other platforms do. To get around this,
	// we'll just calculate the top offset the old fashioned way until core has
	// a chance to figure out how to handle this situation.
	//
	// TODO: We'll need to get rid of getOffsetTop() once a fix gets folded into core.

	function getOffsetTop(ele)
	{
		var top = 0;
		if (ele)
		{
			var op = ele.offsetParent, body = document.body;
			top = ele.offsetTop;
			while (ele && ele != body)
			{
				top += ele.scrollTop || 0;
				if (ele == op)
				{
					top += op.offsetTop;
					op = ele.offsetParent;
				}
				ele = ele.parentNode;
			}
		}
		return top;
	}

	function setTop(el){
		var fromTop = $(window).scrollTop(),
			thisTop = getOffsetTop(el[0]), // el.offset().top returns the wrong value on iPad iOS 3.2.1, call our workaround instead.
			thisCSStop = el.css('top') == 'auto' ? 0 : parseFloat(el.css('top')),
			screenHeight = window.innerHeight,
			thisHeight = el.outerHeight(),
			useRelative = el.parents('.ui-page:not(.ui-page-fullscreen)').length,
			relval;
		if( el.is('.ui-header-fixed') ){
			relval = fromTop - thisTop + thisCSStop;
			if( relval < thisTop){ relval = 0; }
			return el.css('top', ( useRelative ) ? relval : fromTop);
		}
		else{
			//relval = -1 * (thisTop - (fromTop + screenHeight) + thisCSStop + thisHeight);
			//if( relval > thisTop ){ relval = 0; }
			relval = fromTop + screenHeight - thisHeight - (thisTop - thisCSStop);
			return el.css('top', ( useRelative ) ? relval : fromTop + screenHeight - thisHeight );
		}
	}

	//exposed methods
	return {
		show: function(immediately, page){
			currentstate = 'overlay';
			var $ap = page ? $(page) : ($.mobile.activePage ? $.mobile.activePage : $(".ui-page-active"));
			return $ap.children( toolbarSelector ).each(function(){
				var el = $(this),
					fromTop = $(window).scrollTop(),
					thisTop = getOffsetTop(el[0]), // el.offset().top returns the wrong value on iPad iOS 3.2.1, call our workaround instead.
					screenHeight = window.innerHeight,
					thisHeight = el.outerHeight(),
					alreadyVisible = (el.is('.ui-header-fixed') && fromTop <= thisTop + thisHeight) || (el.is('.ui-footer-fixed') && thisTop <= fromTop + screenHeight);	
				
				//add state class
				el.addClass('ui-fixed-overlay').removeClass('ui-fixed-inline');	
					
				if( !alreadyVisible && !immediately ){
					el.animationComplete(function(){
						el.removeClass('in');
					}).addClass('in');
				}
				setTop(el);
			});	
		},
		hide: function(immediately){
			currentstate = 'inline';
			var $ap = $.mobile.activePage ? $.mobile.activePage : $(".ui-page-active");
			return $ap.children( toolbarSelector ).each(function(){
				var el = $(this);

				var thisCSStop = el.css('top'); thisCSStop = thisCSStop == 'auto' ? 0 : parseFloat(thisCSStop);
				
				//add state class
				el.addClass('ui-fixed-inline').removeClass('ui-fixed-overlay');
				
				if (thisCSStop < 0 || (el.is('.ui-header-fixed') && thisCSStop != 0))
				{
					if(immediately){
						el.css('top',0);
					}
					else{
						if( el.css('top') !== 'auto' && parseFloat(el.css('top')) !== 0 ){
							var classes = 'out reverse';
							el.animationComplete(function(){
								el.removeClass(classes);
								el.css('top',0);
							}).addClass(classes);	
						}
					}
				}
			});
		},
		hideAfterDelay: function(){
			delayTimer = setTimeout(function(){
				$.fixedToolbars.hide();
			}, 3000);
		},
		toggle: function(from){
			if(from){ currentstate = from; }
			return (currentstate == 'overlay') ? $.fixedToolbars.hide() : $.fixedToolbars.show();
		},
        setTouchToggleEnabled: function(enabled) {
            touchToggleEnabled = enabled;
        }
	};
})();

})(jQuery);/*
* jQuery Mobile Framework : "checkboxradio" plugin
* Copyright (c) jQuery Project
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*/  
(function($, undefined ) {
$.widget( "mobile.checkboxradio", $.mobile.widget, {
	options: {
		theme: null
	},
	_create: function(){
		var input = this.element,
			label = $("label[for='" + input.attr( "id" ) + "']"),
			inputtype = input.attr( "type" ),
			checkedicon = "ui-icon-" + inputtype + "-on",
			uncheckedicon = "ui-icon-" + inputtype + "-off";

		if ( inputtype != "checkbox" && inputtype != "radio" ) { return; }
						
		label
			.buttonMarkup({
				theme: this.options.theme,
				icon: this.element.parents( "[data-type='horizontal']" ).length ? undefined : uncheckedicon,
				shadow: false
			});
		
		// wrap the input + label in a div 
		input
			.add( label )
			.wrapAll( "<div class='ui-" + inputtype +"'></div>" );
		
		label.bind({
			mouseover: function() {
				if( $(this).parent().is('.ui-disabled') ){ return false; }
			},
			
			mousedown: function() {
				if( $(this).parent().is('.ui-disabled') ){ return false; }
				label.data( "state", input.attr( "checked" ) );
			},
			
			click: function() {
				setTimeout(function() {
					if ( input.attr( "checked" ) === label.data( "state" ) ) {
						input.trigger( "click" );
					}
				}, 1);
			}
		});
		
		input
			.bind({

				click: function() {
					$( "input[name='" + input.attr( "name" ) + "'][type='" + inputtype + "']" ).checkboxradio( "refresh" );
				},

				focus: function() { 
					label.addClass( "ui-focus" ); 
				},

				blur: function() {
					label.removeClass( "ui-focus" );
				}
			});
			
		this.refresh();
		
	},
	
	refresh: function( ){
		var input = this.element,
			label = $("label[for='" + input.attr( "id" ) + "']"),
			inputtype = input.attr( "type" ),
			icon = label.find( ".ui-icon" ),
			checkedicon = "ui-icon-" + inputtype + "-on",
			uncheckedicon = "ui-icon-" + inputtype + "-off";
		
		if ( input[0].checked ) {
			label.addClass( "ui-btn-active" );
			icon.addClass( checkedicon );
			icon.removeClass( uncheckedicon );

		} else {
			label.removeClass( "ui-btn-active" ); 
			icon.removeClass( checkedicon );
			icon.addClass( uncheckedicon );
		}
		
		if( input.is( ":disabled" ) ){
			this.disable();
		}
		else {
			this.enable();
		}
	},
	
	disable: function(){
		this.element.attr("disabled",true).parent().addClass("ui-disabled");
	},
	
	enable: function(){
		this.element.attr("disabled",false).parent().removeClass("ui-disabled");
	}
});
})( jQuery );
/*
* jQuery Mobile Framework : "textinput" plugin for text inputs, textareas
* Copyright (c) jQuery Project
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*/
(function($, undefined ) {
$.widget( "mobile.textinput", $.mobile.widget, {
	options: {
		theme: null
	},
	_create: function(){
		var input = this.element,
			o = this.options,
			theme = o.theme,
			themeclass;
			
		if ( !theme ) {
			var themedParent = this.element.closest("[class*='ui-bar-'],[class*='ui-body-']"); 
				theme = themedParent.length ?
					/ui-(bar|body)-([a-z])/.exec( themedParent.attr("class") )[2] :
					"c";
		}	
		
		themeclass = " ui-body-" + theme;
		
		$('label[for='+input.attr('id')+']').addClass('ui-input-text');
		
		input.addClass('ui-input-text ui-body-'+ o.theme);
		
		var focusedEl = input;
		
		//"search" input widget
		if( input.is('[type="search"],[data-type="search"]') ){
			focusedEl = input.wrap('<div class="ui-input-search ui-shadow-inset ui-btn-corner-all ui-btn-shadow ui-icon-search'+ themeclass +'"></div>').parent();
			var clearbtn = $('<a href="#" class="ui-input-clear" title="clear text">clear text</a>')
				.click(function(){
					input.val('').focus();
					input.trigger('change'); 
					clearbtn.addClass('ui-input-clear-hidden');
					return false;
				})
				.appendTo(focusedEl)
				.buttonMarkup({icon: 'delete', iconpos: 'notext', corners:true, shadow:true});
			
			function toggleClear(){
				if(input.val() == ''){
					clearbtn.addClass('ui-input-clear-hidden');
				}
				else{
					clearbtn.removeClass('ui-input-clear-hidden');
				}
			}
			
			toggleClear();
			input.keyup(toggleClear);	
		}
		else{
			input.addClass('ui-corner-all ui-shadow-inset' + themeclass);
		}
				
		input
			.focus(function(){
				focusedEl.addClass('ui-focus');
			})
			.blur(function(){
				focusedEl.removeClass('ui-focus');
			});	
			
		//autogrow
		if ( input.is('textarea') ) {
			var extraLineHeight = 15,
				keyupTimeoutBuffer = 100,
				keyup = function() {
					var scrollHeight = input[0].scrollHeight,
						clientHeight = input[0].clientHeight;
					if ( clientHeight < scrollHeight ) {
						input.css({ height: (scrollHeight + extraLineHeight) });
					}
				},
				keyupTimeout;
			input.keyup(function() {
				clearTimeout( keyupTimeout );
				keyupTimeout = setTimeout( keyup, keyupTimeoutBuffer );
			});
		}
	},
	
	disable: function(){
		( this.element.attr("disabled",true).is('[type="search"],[data-type="search"]') ? this.element.parent() : this.element ).addClass("ui-disabled");
	},
	
	enable: function(){
		( this.element.attr("disabled", false).is('[type="search"],[data-type="search"]') ? this.element.parent() : this.element ).removeClass("ui-disabled");
	}
});
})( jQuery );
/*
* jQuery Mobile Framework : "selectmenu" plugin
* Copyright (c) jQuery Project
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*/  
(function($, undefined ) {
$.widget( "mobile.selectmenu", $.mobile.widget, {
	options: {
		theme: null,
		disabled: false, 
		icon: 'arrow-d',
		iconpos: 'right',
		inline: null,
		corners: true,
		shadow: true,
		iconshadow: true,
		menuPageTheme: 'b',
		overlayTheme: 'a',
		hidePlaceholderMenuItems: true
	},
	_create: function(){
	
		var self = this,
		
			o = this.options,
			
			select = this.element
						.attr( "tabindex", "-1" )
						.wrap( "<div class='ui-select'>" ),		
							
			selectID = select.attr( "id" ),
			
			label = $( "label[for="+ selectID +"]" ).addClass( "ui-select" ),
									
			buttonId = selectID + "-button",
			
			menuId = selectID + "-menu",
			
			thisPage = select.closest( ".ui-page" ),
				
			button = $( "<a>", { 
					"href": "#",
					"role": "button",
					"id": buttonId,
					"aria-haspopup": "true",
					"aria-owns": menuId 
				})
				.text( $( select[0].options.item(select[0].selectedIndex) ).text() )
				.insertBefore( select )
				.buttonMarkup({
					theme: o.theme, 
					icon: o.icon,
					iconpos: o.iconpos,
					inline: o.inline,
					corners: o.corners,
					shadow: o.shadow,
					iconshadow: o.iconshadow
				}),
				
			theme = /ui-btn-up-([a-z])/.exec( button.attr("class") )[1],
				
			menuPage = $( "<div data-role='dialog' data-theme='"+ o.menuPageTheme +"'>" +
						"<div data-role='header'>" +
							"<div class='ui-title'>" + label.text() + "</div>"+
						"</div>"+
						"<div data-role='content'></div>"+
					"</div>" )
					.appendTo( $.mobile.pageContainer )
					.page(),	
					
			menuPageContent = menuPage.find( ".ui-content" ),	
					
			screen = $( "<div>", {"class": "ui-selectmenu-screen ui-screen-hidden"})
						.appendTo( thisPage ),		
								
			listbox = $( "<div>", { "class": "ui-selectmenu ui-selectmenu-hidden ui-overlay-shadow ui-corner-all pop ui-body-" + o.overlayTheme } )
					.insertAfter(screen),
					
			list = $( "<ul>", { 
					"class": "ui-selectmenu-list", 
					"id": menuId, 
					"role": "listbox", 
					"aria-labelledby": buttonId,
					"data-theme": theme
				})
				.appendTo( listbox ),
				
			menuType;	
			
		//expose to other methods	
		$.extend(self, {
			select: select,
			selectID: selectID,
			label: label,
			buttonId:buttonId,
			menuId:menuId,
			thisPage:thisPage,
			button:button,
			menuPage:menuPage,
			menuPageContent:menuPageContent,
			screen:screen,
			listbox:listbox,
			list:list,
			menuType:menuType
		});
					
		
		//create list from select, update state
		self.refresh();
		
		//disable if specified
		if( this.options.disabled ){ this.disable(); }

		//events on native select
		select
			.change(function(){ 
				self.refresh();
			})
			.focus(function(){
				$(this).blur();
				button.focus();
			});		
		
		//button events
		button.bind( $.support.touch ? "touchstart" : "click", function(event){
			self.open();
			event.preventDefault();
		});
		
		//events for list items
		list.delegate("li:not(.ui-disabled, .ui-li-divider)", "click", function(event){
				//update select	
				var newIndex = list.find( "li:not(.ui-li-divider)" ).index( this ),
					prevIndex = select[0].selectedIndex;

				select[0].selectedIndex = newIndex;
				
				//trigger change event
				if(newIndex !== prevIndex){ 
					select.trigger( "change" ); 
				}
				
				self.refresh();
				
				//hide custom select
				self.close();
				event.preventDefault();
			});	
	
		//events on "screen" overlay
		screen.click(function(event){
			self.close();
			event.preventDefault();
		});
	},
	
	_buildList: function(){
		var self = this, 
			optgroups = [],
			o = this.options;
		
		self.list.empty().filter('.ui-listview').listview('destroy');
		
		//populate menu with options from select element
		self.select.find( "option" ).each(function( i ){
			var $this = $(this),
				$parent = $this.parent();
			
			// are we inside an optgroup?
			if( $parent.is("optgroup") ){
				var optLabel = $parent.attr("label");
				
				// has this optgroup already been built yet?
				if( $.inArray(optLabel, optgroups) === -1 ){
					var optgroup = $('<li data-role="list-divider"></li>')
						.text( optLabel )
						.appendTo( self.list );
					
					optgroups.push( optLabel );
				}
			}

			var anchor = $("<a>", { 
				"role": "option", 
				"href": "#",
				"text": $(this).text()
			}),
		
			item = $( "<li>", {"data-icon": "checkbox-on"});
			
			// support disabled option tags
			if( this.disabled ){
				item
					.addClass("ui-disabled")
					.attr("aria-disabled", true);
			}
			
			if( o.hidePlaceholderMenuItems ){
				if( !this.getAttribute('value') || $(this).text().length == 0 || $(this).data('placeholder')){
					item.addClass('ui-selectmenu-placeholder');
				}
			}

			item
				.append( anchor )
				.appendTo( self.list );
		});
		
		//now populated, create listview
		self.list.listview();		
	},
	
	refresh: function( forceRebuild ){
		var self = this,
			select = this.element,
			selected = select[0].selectedIndex;
		
		if( forceRebuild || select[0].options.length > self.list.find('li').length ){
			self._buildList();
		}	
			
		self.button.find( ".ui-btn-text" ).text( $(select[0].options.item(selected)).text() ); 
		self.list
			.find('li:not(.ui-li-divider)').removeClass( $.mobile.activeBtnClass ).attr('aria-selected', false)
			.eq(selected).addClass( $.mobile.activeBtnClass ).find('a').attr('aria-selected', true);		
	},
	
	open: function(){
		if( this.options.disabled ){ return; }
		
		var self = this,
			menuHeight = self.list.outerHeight(),
			menuWidth = self.list.outerWidth(),
			scrollTop = $(window).scrollTop(),
			btnOffset = self.button.offset().top,
			screenHeight = window.innerHeight,
			screenWidth = window.innerWidth;
			
		//add active class to button
		self.button.addClass( $.mobile.activeBtnClass );
			
		function focusMenuItem(){
			self.list.find( ".ui-btn-active" ).focus();
		}
		
		if( menuHeight > screenHeight - 80 || !$.support.scrollTop ){
			
			//for webos (set lastscroll using button offset)
			if( scrollTop == 0 && btnOffset > screenHeight ){
				self.thisPage.one('pagehide',function(){
					$(this).data('lastScroll', btnOffset);
				});	
			}
			
			self.menuPage.one('pageshow',focusMenuItem);
		
			self.menuType = "page";		
			self.menuPageContent.append( self.list );
			$.mobile.changePage(self.menuPage, 'pop', false, false);
		}
		else {
			self.menuType = "overlay";
						
			self.screen
				.height( $(document).height() )
				.removeClass('ui-screen-hidden');
				
			self.listbox
				.append( self.list )
				.removeClass( "ui-selectmenu-hidden" )
				.position({
					my: "center center",
					at: "center center",
					of: self.button,
					collision: "fit"
				})
				.addClass("in");
				
			focusMenuItem();	
		}
	},
	
	close: function(){
		if( this.options.disabled ){ return; }
		var self = this;
		
		function focusButton(){
			setTimeout(function(){
				self.button.focus();
				//remove active class from button
				self.button.removeClass( $.mobile.activeBtnClass );
			}, 40);
			
			self.listbox.removeAttr('style').append( self.list );
		}
		
		if(self.menuType == "page"){			
			$.mobile.changePage([self.menuPage,self.thisPage], 'pop', true, false);
			self.menuPage.one("pagehide",function(){
				focusButton();
				//return false;
			});
		}
		else{
			self.screen.addClass( "ui-screen-hidden" );
			self.listbox.addClass( "ui-selectmenu-hidden" ).removeAttr( "style" ).removeClass("in");
			focusButton();
		}
		
	},
	
	disable: function(){
		this.element.attr("disabled",true);
		this.button.addClass('ui-disabled').attr("aria-disabled", true);
		return this._setOption( "disabled", true );
	},
	
	enable: function(){
		this.element.attr("disabled",false);
		this.button.removeClass('ui-disabled').attr("aria-disabled", false);
		return this._setOption( "disabled", false );
	}
});
})( jQuery );
	
/*
* jQuery Mobile Framework : plugin for making button-like links
* Copyright (c) jQuery Project
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*/ 
(function($, undefined ) {

$.fn.buttonMarkup = function( options ){
	return this.each( function() {
		var el = $( this ),
		    o = $.extend( {}, $.fn.buttonMarkup.defaults, el.data(), options),

			// Classes Defined
			buttonClass,
			innerClass = "ui-btn-inner",
			iconClass;

		if ( attachEvents ) {
			attachEvents();
		}

		// if not, try to find closest theme container
		if ( !o.theme ) {
			var themedParent = el.closest("[class*='ui-bar-'],[class*='ui-body-']"); 
			o.theme = themedParent.length ?
				/ui-(bar|body)-([a-z])/.exec( themedParent.attr("class") )[2] :
				"c";
		}

		buttonClass = "ui-btn ui-btn-up-" + o.theme;
		
		if ( o.inline ) {
			buttonClass += " ui-btn-inline";
		}
		
		if ( o.icon ) {
			o.icon = "ui-icon-" + o.icon;
			o.iconpos = o.iconpos || "left";

			iconClass = "ui-icon " + o.icon;

			if ( o.shadow ) {
				iconClass += " ui-icon-shadow"
			}
		}

		if ( o.iconpos ) {
			buttonClass += " ui-btn-icon-" + o.iconpos;
			
			if ( o.iconpos == "notext" && !el.attr("title") ) {
				el.attr( "title", el.text() );
			}
		}
		
		if ( o.corners ) { 
			buttonClass += " ui-btn-corner-all";
			innerClass += " ui-btn-corner-all";
		}
		
		if ( o.shadow ) {
			buttonClass += " ui-shadow";
		}
		
		el
			.attr( "data-theme", o.theme )
			.addClass( buttonClass );

		var wrap = ("<D class='" + innerClass + "'><D class='ui-btn-text'></D>" +
			( o.icon ? "<span class='" + iconClass + "'></span>" : "" ) +
			"</D>").replace(/D/g, o.wrapperEls);

		el.wrapInner( wrap );
	});		
};

$.fn.buttonMarkup.defaults = {
	corners: true,
	shadow: true,
	iconshadow: true,
	wrapperEls: "span"
};

var attachEvents = function() {
	$(".ui-btn:not(.ui-disabled)").live({
		mousedown: function() {
			var theme = $(this).attr( "data-theme" );
			$(this).removeClass( "ui-btn-up-" + theme ).addClass( "ui-btn-down-" + theme );
		},
		mouseup: function() {
			var theme = $(this).attr( "data-theme" );
			$(this).removeClass( "ui-btn-down-" + theme ).addClass( "ui-btn-up-" + theme );
		},
		"mouseover focus": function() {
			var theme = $(this).attr( "data-theme" );
			$(this).removeClass( "ui-btn-up-" + theme ).addClass( "ui-btn-hover-" + theme );
		},
		"mouseout blur": function() {
			var theme = $(this).attr( "data-theme" );
			$(this).removeClass( "ui-btn-hover-" + theme ).addClass( "ui-btn-up-" + theme );
		}
	});

	attachEvents = null;
};

})(jQuery);
/*
* jQuery Mobile Framework : "button" plugin - links that proxy to native input/buttons
* Copyright (c) jQuery Project
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*/ 
(function($, undefined ) {
$.widget( "mobile.button", $.mobile.widget, {
	options: {
		theme: null, 
		icon: null,
		iconpos: null,
		inline: null,
		corners: true,
		shadow: true,
		iconshadow: true
	},
	_create: function(){
		var $el = this.element,
			o = this.options;
		
		//add ARIA role
		this.button = $( "<div></div>" )
			.text( $el.text() || $el.val() )
			.buttonMarkup({
				theme: o.theme, 
				icon: o.icon,
				iconpos: o.iconpos,
				inline: o.inline,
				corners: o.corners,
				shadow: o.shadow,
				iconshadow: o.iconshadow
			})
			.insertBefore( $el )
			.append( $el.addClass('ui-btn-hidden') );
		
		//add hidden input during submit
		if( $el.attr('type') !== 'reset' ){
			$el.click(function(){
				var $buttonPlaceholder = $("<input>", 
						{type: "hidden", name: $el.attr("name"), value: $el.attr("value")})
						.insertBefore($el);
						
				//bind to doc to remove after submit handling	
				$(document).submit(function(){
					 $buttonPlaceholder.remove();
				});
			});
		}
			
	},

	enable: function(){
		this.element.attr("disabled", false);
		this.button.removeClass("ui-disabled").attr("aria-disabled", false);
		return this._setOption("disabled", false);
	},

	disable: function(){
		this.element.attr("disabled", true);
		this.button.addClass("ui-disabled").attr("aria-disabled", true);
		return this._setOption("disabled", true);
	}
});
})( jQuery );/*
* jQuery Mobile Framework : "slider" plugin
* Copyright (c) jQuery Project
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*/  
(function($, undefined ) {
$.widget( "mobile.slider", $.mobile.widget, {
	options: {
		theme: null,
		trackTheme: null,
		disabled: false
	},
	_create: function(){	
		var self = this,

			control = this.element,
		
			parentTheme = control.parents('[class*=ui-bar-],[class*=ui-body-]').eq(0),	
			
			parentTheme = parentTheme.length ? parentTheme.attr('class').match(/ui-(bar|body)-([a-z])/)[2] : 'c',
					
			theme = this.options.theme ? this.options.theme : parentTheme,
			
			trackTheme = this.options.trackTheme ? this.options.trackTheme : parentTheme,
			
			cType = control[0].nodeName.toLowerCase(),
			selectClass = (cType == 'select') ? 'ui-slider-switch' : '',
			controlID = control.attr('id'),
			labelID = controlID + '-label',
			label = $('[for='+ controlID +']').attr('id',labelID),
			val = (cType == 'input') ? parseFloat(control.val()) : control[0].selectedIndex,
			min = (cType == 'input') ? parseFloat(control.attr('min')) : 0,
			max = (cType == 'input') ? parseFloat(control.attr('max')) : control.find('option').length-1,
			slider = $('<div class="ui-slider '+ selectClass +' ui-btn-down-'+ trackTheme+' ui-btn-corner-all" role="application"></div>'),
			handle = $('<a href="#" class="ui-slider-handle"></a>')
				.appendTo(slider)
				.buttonMarkup({corners: true, theme: theme, shadow: true})
				.attr({
					'role': 'slider',
					'aria-valuemin': min,
					'aria-valuemax': max,
					'aria-valuenow': val,
					'aria-valuetext': val,
					'title': val,
					'aria-labelledby': labelID
				});

		$.extend(this, {
			slider: slider,
			handle: handle,
			dragging: false,
			beforeStart: null
		});

		if(cType == 'select'){
			slider.wrapInner('<div class="ui-slider-inneroffset"></div>');
			var options = control.find('option');
				
			control.find('option').each(function(i){
				var side = (i==0) ?'b':'a',
					corners = (i==0) ? 'right' :'left',
					theme = (i==0) ? ' ui-btn-down-' + trackTheme :' ui-btn-active';
				$('<div class="ui-slider-labelbg ui-slider-labelbg-'+ side + theme +' ui-btn-corner-'+ corners+'"></div>').prependTo(slider);	
				$('<span class="ui-slider-label ui-slider-label-'+ side + theme +' ui-btn-corner-'+ corners+'" role="img">'+$(this).text()+'</span>').prependTo(handle);
			});
			
		}	
		
		label.addClass('ui-slider');
		
		control
			.addClass((cType == 'input') ? 'ui-slider-input' : 'ui-slider-switch')
			.keyup(function(){
				self.refresh( $(this).val() );
			});
			
		$(document).bind($.support.touch ? "touchmove" : "mousemove", function(event){
			if ( self.dragging ) {
				self.refresh( event );
				return false;
			}
		});
					
		slider
			.bind($.support.touch ? "touchstart" : "mousedown", function(event){
				self.dragging = true;
				if ( cType === "select" ) {
					self.beforeStart = control[0].selectedIndex;
				}
				self.refresh( event );
				return false;
			});
			
		slider
			.add(document)	
			.bind($.support.touch ? "touchend" : "mouseup", function(){
				if ( self.dragging ) {
					self.dragging = false;
					if ( cType === "select" ) {
						if ( self.beforeStart === control[0].selectedIndex ) {
							//tap occurred, but value didn't change. flip it!
							self.refresh( self.beforeStart === 0 ? 1 : 0 );
						}
						var curval = (cType === "input") ? parseFloat(control.val()) : control[ 0 ].selectedIndex;
						var snapped = Math.round( curval / (max - min) * 100 );
						handle
							.addClass("ui-slider-handle-snapping")
							.css("left", snapped + "%")
							.animationComplete(function(){
								handle.removeClass("ui-slider-handle-snapping");
							});
					}
					return false;
				}
			});

		slider.insertAfter(control);
		handle.bind('click', function(e){ return false; });
		this.refresh();
	},

	refresh: function(val){
		if ( this.options.disabled ) { return; }

		var control = this.element, percent,
			cType = control[0].nodeName.toLowerCase(),
			min = (cType === "input") ? parseFloat(control.attr("min")) : 0,
			max = (cType === "input") ? parseFloat(control.attr("max")) : control.find("option").length - 1;

		if ( typeof val === "object" ) {
			var data = val.originalEvent.touches ? val.originalEvent.touches[ 0 ] : val,
				// a slight tolerance helped get to the ends of the slider
				tol = 8;
			if ( !this.dragging
					|| data.pageX < this.slider.offset().left - tol
					|| data.pageX > this.slider.offset().left + this.slider.width() + tol ) {
				return;
			}
			percent = Math.round( ((data.pageX - this.slider.offset().left) / this.slider.width() ) * 100 );
		} else {
			if ( val == null ) {
				val = (cType === "input") ? parseFloat(control.val()) : control[ 0 ].selectedIndex;
			}
			percent = (parseFloat(val) - min) / (max - min) * 100;
		}

		if ( isNaN(percent) ) { return; }
		if ( percent < 0 ) { percent = 0; }
		if ( percent > 100 ) { percent = 100; }

		var newval = Math.round( (percent / 100) * (max - min) ) + min;
		if ( newval < min ) { newval = min; }
		if ( newval > max ) { newval = max; }

		//flip the stack of the bg colors
		if ( percent > 60 && cType === "select" ) {
			
		}
		this.handle.css("left", percent + "%");
		this.handle.attr({
				"aria-valuenow": (cType === "input") ? newval : control.find("option").eq(newval).attr("value"),
				"aria-valuetext": (cType === "input") ? newval : control.find("option").eq(newval).text(),
				title: newval
			});

		// add/remove classes for flip toggle switch
		if ( cType === "select" ) {
			if ( newval === 0 ) {
				this.slider.addClass("ui-slider-switch-a")
					.removeClass("ui-slider-switch-b");
			} else {
				this.slider.addClass("ui-slider-switch-b")
					.removeClass("ui-slider-switch-a");
			}
		}

		// update control's value
		if ( cType === "input" ) {
			control.val(newval);
		} else {
			control[ 0 ].selectedIndex = newval;
		}
		control.trigger("change");
	},

	enable: function(){
		this.element.attr("disabled", false);
		this.slider.removeClass("ui-disabled").attr("aria-disabled", false);
		return this._setOption("disabled", false);
	},

	disable: function(){
		this.element.attr("disabled", true);
		this.slider.addClass("ui-disabled").attr("aria-disabled", true);
		return this._setOption("disabled", true);
	}
});
})( jQuery );
	
/*
* jQuery Mobile Framework : "collapsible" plugin
* Copyright (c) jQuery Project
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*/ 
(function($, undefined ) {
$.widget( "mobile.collapsible", $.mobile.widget, {
	options: {
		expandCueText: ' click to expand contents',
		collapseCueText: ' click to collapse contents',
		collapsed: false,
		heading: '>:header,>legend',
		theme: null,
		iconTheme: 'd'
	},
	_create: function(){

		var $el = this.element,
			o = this.options,
			collapsibleContain = $el.addClass('ui-collapsible-contain'),
			collapsibleHeading = $el.find(o.heading).eq(0),
			collapsibleContent = collapsibleContain.wrapInner('<div class="ui-collapsible-content"></div>').find('.ui-collapsible-content'),
			collapsibleParent = $el.closest('[data-role="collapsible-set"]').addClass('ui-collapsible-set');				
		
		//replace collapsibleHeading if it's a legend	
		if(collapsibleHeading.is('legend')){
			collapsibleHeading = $('<div role="heading">'+ collapsibleHeading.html() +'</div>').insertBefore(collapsibleHeading);
			collapsibleHeading.next().remove();
		}	
		
		//drop heading in before content
		collapsibleHeading.insertBefore(collapsibleContent);
		
		//modify markup & attributes
		collapsibleHeading.addClass('ui-collapsible-heading')
			.append('<span class="ui-collapsible-heading-status"></span>')
			.wrapInner('<a href="#" class="ui-collapsible-heading-toggle"></a>')
			.find('a:eq(0)')
			.buttonMarkup({
				shadow: !!!collapsibleParent.length,
				corners:false,
				iconPos: 'left',
				icon: 'plus',
				theme: o.theme
			})
			.find('.ui-icon')
			.removeAttr('class')
			.buttonMarkup({
				shadow: true,
				corners:true,
				iconPos: 'notext',
				icon: 'plus',
				theme: o.iconTheme
			});
			
			if( !collapsibleParent.length ){
				collapsibleHeading
					.find('a:eq(0)')	
					.addClass('ui-corner-all')
						.find('.ui-btn-inner')
						.addClass('ui-corner-all');
			}
			else {
				if( collapsibleContain.data('collapsible-last') ){
					collapsibleHeading
						.find('a:eq(0), .ui-btn-inner')	
							.addClass('ui-corner-bottom');
				}					
			}
			
		
		//events
		collapsibleContain	
			.bind('collapse', function(event){
				if( !event.isDefaultPrevented() ){
					event.preventDefault();
					collapsibleHeading
						.addClass('ui-collapsible-heading-collapsed')
						.find('.ui-collapsible-heading-status').text(o.expandCueText);
					
					collapsibleHeading.find('.ui-icon').removeClass('ui-icon-minus').addClass('ui-icon-plus');	
					collapsibleContent.addClass('ui-collapsible-content-collapsed').attr('aria-hidden',true);
					
					if( collapsibleContain.data('collapsible-last') ){
						collapsibleHeading
							.find('a:eq(0), .ui-btn-inner')
							.addClass('ui-corner-bottom');
					}
				}						
				
			})
			.bind('expand', function(event){
				if( !event.isDefaultPrevented() ){
					event.preventDefault();
					collapsibleHeading
						.removeClass('ui-collapsible-heading-collapsed')
						.find('.ui-collapsible-heading-status').text(o.collapseCueText);
					
					collapsibleHeading.find('.ui-icon').removeClass('ui-icon-plus').addClass('ui-icon-minus');	
					collapsibleContent.removeClass('ui-collapsible-content-collapsed').attr('aria-hidden',false);
					
					if( collapsibleContain.data('collapsible-last') ){
						collapsibleHeading
							.find('a:eq(0), .ui-btn-inner')
							.removeClass('ui-corner-bottom');
					}
					
				}
			})
			.trigger(o.collapsed ? 'collapse' : 'expand');
			
		
		//close others in a set
		if( collapsibleParent.length && !collapsibleParent.data("collapsiblebound") ){
			collapsibleParent
				.data("collapsiblebound", true)
				.bind("expand", function( event ){
					$(this).find( ".ui-collapsible-contain" )
						.not( $(event.target).closest( ".ui-collapsible-contain" ) )
						.not( "> .ui-collapsible-contain .ui-collapsible-contain" )
						.trigger( "collapse" );
				})
			var set = collapsibleParent.find('[data-role=collapsible]')
					
			set.first()
				.find('a:eq(0)')	
				.addClass('ui-corner-top')
					.find('.ui-btn-inner')
					.addClass('ui-corner-top');
					
			set.last().data('collapsible-last', true)	
		}
					
		collapsibleHeading.bind( $.support.touch ? "touchstart" : "click", function(){ 
			if( collapsibleHeading.is('.ui-collapsible-heading-collapsed') ){
				collapsibleContain.trigger('expand'); 
			}	
			else {
				collapsibleContain.trigger('collapse'); 
			}
			return false;
		});
			
	}
});
})( jQuery );/*
* jQuery Mobile Framework: "controlgroup" plugin - corner-rounding for groups of buttons, checks, radios, etc
* Copyright (c) jQuery Project
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*/
(function($, undefined ) {
$.fn.controlgroup = function(options){
		
	return $(this).each(function(){
		var o = $.extend({
			direction: $( this ).data( "type" ) || "vertical",
			shadow: false
		},options);
		var groupheading = $(this).find('>legend'),
			flCorners = o.direction == 'horizontal' ? ['ui-corner-left', 'ui-corner-right'] : ['ui-corner-top', 'ui-corner-bottom'],
			type = $(this).find('input:eq(0)').attr('type');
		
		//replace legend with more stylable replacement div	
		if( groupheading.length ){
			$(this).wrapInner('<div class="ui-controlgroup-controls"></div>');	
			$('<div role="heading" class="ui-controlgroup-label">'+ groupheading.html() +'</div>').insertBefore( $(this).children(0) );	
			groupheading.remove();	
		}

		$(this).addClass('ui-corner-all ui-controlgroup ui-controlgroup-'+o.direction);
		
		function flipClasses(els){
			els
				.removeClass('ui-btn-corner-all ui-shadow')
				.eq(0).addClass(flCorners[0])
				.end()
				.filter(':last').addClass(flCorners[1]).addClass('ui-controlgroup-last');
		}
		flipClasses($(this).find('.ui-btn'));
		flipClasses($(this).find('.ui-btn-inner'));
		if(o.shadow){
			$(this).addClass('ui-shadow');
		}
	});	
};
})(jQuery);/*
* jQuery Mobile Framework : "fieldcontain" plugin - simple class additions to make form row separators
* Copyright (c) jQuery Project
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*/
(function($, undefined ) {
$.fn.fieldcontain = function(options){
	return $(this).addClass('ui-field-contain ui-body ui-br');
};
})(jQuery);/*
* jQuery Mobile Framework : "listview" plugin
* Copyright (c) jQuery Project
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*/
(function($, undefined ) {

$.widget( "mobile.listview", $.mobile.widget, {
	options: {
		theme: "c",
		countTheme: "c",
		headerTheme: "b",
		dividerTheme: "b",
		splitIcon: "arrow-r",
		splitTheme: "b",
		inset: false
	},
	
	_create: function() {
		var $list = this.element,
			o = this.options;

		// create listview markup 
		$list
			.addClass( "ui-listview" )
			.attr( "role", "listbox" )
		
		if ( o.inset ) {
			$list.addClass( "ui-listview-inset ui-corner-all ui-shadow" );
		}	

		$list.delegate( ".ui-li", "focusin", function() {
			$( this ).attr( "tabindex", "0" );
		});

		this._itemApply( $list, $list );
		
		this.refresh( true );
	
		//keyboard events for menu items
		$list.keydown(function( e ) {
			var target = $( e.target ),
				li = target.closest( "li" );

			// switch logic based on which key was pressed
			switch ( e.keyCode ) {
				// up or left arrow keys
				case 38:
					var prev = li.prev();

					// if there's a previous option, focus it
					if ( prev.length ) {
						target
							.blur()
							.attr( "tabindex", "-1" );

						prev.find( "a" ).first().focus();
					}	

					return false;
				break;

				// down or right arrow keys
				case 40:
					var next = li.next();
				
					// if there's a next option, focus it
					if ( next.length ) {
						target
							.blur()
							.attr( "tabindex", "-1" );
						
						next.find( "a" ).first().focus();
					}	

					return false;
				break;

				case 39:
					var a = li.find( "a.ui-li-link-alt" );

					if ( a.length ) {
						target.blur();
						a.first().focus();
					}

					return false;
				break;

				case 37:
					var a = li.find( "a.ui-link-inherit" );

					if ( a.length ) {
						target.blur();
						a.first().focus();
					}

					return false;
				break;

				// if enter or space is pressed, trigger click
				case 13:
				case 32:
					 target.trigger( "click" );

					 return false;
				break;	
			}
		});	

		// tapping the whole LI triggers click on the first link
		$list.delegate( "li", "click", function(event) {
			if ( !$( event.target ).closest( "a" ).length ) {
				$( this ).find( "a" ).first().trigger( "click" );
				return false;
			}
		});
	},

	_itemApply: function( $list, item ) {
		// TODO class has to be defined in markup
		item.find( ".ui-li-count" )
			.addClass( "ui-btn-up-" + ($list.data( "counttheme" ) || this.options.countTheme) + " ui-btn-corner-all" );

		item.find( "h1, h2, h3, h4, h5, h6" ).addClass( "ui-li-heading" );

		item.find( "p, dl" ).addClass( "ui-li-desc" );

		item.find( "img" ).addClass( "ui-li-thumb" ).each(function() {
			$( this ).closest( "li" )
				.addClass( $(this).is( ".ui-li-icon" ) ? "ui-li-has-icon" : "ui-li-has-thumb" );
		});

		var aside = item.find( ".ui-li-aside" );

		if ( aside.length ) {
            aside.each(function(i, el) {
			    $(el).prependTo( $(el).parent() ); //shift aside to front for css float
            });
		}

		if ( $.support.cssPseudoElement || !$.nodeName( item[0], "ol" ) ) {
			return;
		}
	},
	
	_removeCorners: function(li){
		li
			.add( li.find(".ui-btn-inner, .ui-li-link-alt, .ui-li-thumb") )
			.removeClass( "ui-corner-top ui-corner-bottom ui-corner-br ui-corner-bl ui-corner-tr ui-corner-tl" );
	},
	
	refresh: function( create ) {
		this._createSubPages();
		
		var o = this.options,
			$list = this.element,
			self = this,
			dividertheme = $list.data( "dividertheme" ) || o.dividerTheme,
			li = $list.children( "li" ),
			counter = $.support.cssPseudoElement || !$.nodeName( $list[0], "ol" ) ? 0 : 1;

		if ( counter ) {
			$list.find( ".ui-li-dec" ).remove();
		}

		li.attr({ "role": "option", "tabindex": "-1" });

		li.first().attr( "tabindex", "0" );

		li.each(function( pos ) {
			var item = $( this ),
				itemClass = "ui-li";

			// If we're creating the element, we update it regardless
			if ( !create && item.hasClass( "ui-li" ) ) {
				return;
			}

			var a = item.find( "a" );
				
			if ( a.length ) {	
				item
					.buttonMarkup({
						wrapperEls: "div",
						shadow: false,
						corners: false,
						iconpos: "right",
						icon: a.length > 1 ? false : item.data("icon") || "arrow-r",
						theme: o.theme
					});

				a.first().addClass( "ui-link-inherit" );

				if ( a.length > 1 ) {
					itemClass += " ui-li-has-alt";

					var last = a.last(),
						splittheme = $list.data( "splittheme" ) || last.data( "theme" ) || o.splitTheme;
					
					last
						.attr( "title", last.text() )
						.addClass( "ui-li-link-alt" )
						.empty()
						.buttonMarkup({
							shadow: false,
							corners: false,
							theme: o.theme,
							icon: false,
							iconpos: false
						})
						.find( ".ui-btn-inner" )
							.append( $( "<span>" ).buttonMarkup({
								shadow: true,
								corners: true,
								theme: splittheme,
								iconpos: "notext",
								icon: $list.data( "spliticon" ) || last.data( "icon" ) ||  o.splitIcon
							} ) );
				}

			} else if ( item.data( "role" ) === "list-divider" ) {
				itemClass += " ui-li-divider ui-btn ui-bar-" + dividertheme;
				item.attr( "role", "heading" );

				//reset counter when a divider heading is encountered
				if ( counter ) {
					counter = 1;
				}

			} else {
				itemClass += " ui-li-static ui-btn-up-" + o.theme;
			}
			
			
			if( o.inset ){	
				if ( pos === 0 ) {
						itemClass += " ui-corner-top";
	
						item
							.add( item.find( ".ui-btn-inner" ) )
							.find( ".ui-li-link-alt" )
								.addClass( "ui-corner-tr" )
							.end()
							.find( ".ui-li-thumb" )
								.addClass( "ui-corner-tl" );
						if(item.next().next().length){
							self._removeCorners( item.next() );		
						}
	
				} else if ( pos === li.length - 1 ) {
						itemClass += " ui-corner-bottom";
	
						item
							.add( item.find( ".ui-btn-inner" ) )
							.find( ".ui-li-link-alt" )
								.addClass( "ui-corner-br" )
							.end()
							.find( ".ui-li-thumb" )
								.addClass( "ui-corner-bl" );
						
						if(item.prev().prev().length){
							self._removeCorners( item.prev() );		
						}	
				}
			}


			if ( counter && itemClass.indexOf( "ui-li-divider" ) < 0 ) {
				item
					.find( ".ui-link-inherit" ).first()
					.addClass( "ui-li-jsnumbering" )
					.prepend( "<span class='ui-li-dec'>" + (counter++) + ". </span>" );
			}

			item.addClass( itemClass );

			if ( !create ) {
				self._itemApply( $list, item );
			}
		});
	},
	
	//create a string for ID/subpage url creation
	_idStringEscape: function( str ){
		return str.replace(/[^a-zA-Z0-9]/g, '-');
	},
	
	_createSubPages: function() {
		var parentList = this.element,
			parentPage = parentList.closest( ".ui-page" ),
			parentId = parentPage.data( "url" ),
			o = this.options,
			self = this,
			persistentFooterID = parentPage.find( "[data-role='footer']" ).data( "id" );

		$( parentList.find( "ul, ol" ).toArray().reverse() ).each(function( i ) {
			var list = $( this ),
				parent = list.parent(),
				title = $.trim(parent.contents()[ 0 ].nodeValue.split("\n")[0]) || parent.find('a:first').text(),
				id = parentId + "&" + $.mobile.subPageUrlKey + "=" + self._idStringEscape(title + " " + i),
				theme = list.data( "theme" ) || o.theme,
				countTheme = list.data( "counttheme" ) || parentList.data( "counttheme" ) || o.countTheme,
				newPage = list.wrap( "<div data-role='page'><div data-role='content'></div></div>" )
							.parent()
								.before( "<div data-role='header' data-theme='" + o.headerTheme + "'><div class='ui-title'>" + title + "</div></div>" )
								.after( persistentFooterID ? $( "<div>", { "data-role": "footer", "data-id": persistentFooterID, "class": "ui-footer-duplicate" } ) : "" )
								.parent()
									.attr({
										"data-url": id,
										"data-theme": theme,
										"data-count-theme": countTheme
									})
									.appendTo( $.mobile.pageContainer );
				
				
				
				newPage.page();		
			var anchor = parent.find('a:first');
			if (!anchor.length) {
				anchor = $("<a></a>").html(title).prependTo(parent.empty());
			}
			anchor.attr('href','#' + id);
		}).listview();
	}
});

})( jQuery );
/*
* jQuery Mobile Framework : "listview" filter extension
* Copyright (c) jQuery Project
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*/
(function($, undefined ) {

$.mobile.listview.prototype.options.filter = false;

$( "[data-role='listview']" ).live( "listviewcreate", function() {
	var list = $( this ),
		listview = list.data( "listview" );
	if ( !listview.options.filter ) {
		return;
	}

	var wrapper = $( "<form>", { "class": "ui-listview-filter ui-bar-c", "role": "search" } ),
		
		search = $( "<input>", {
				placeholder: "Filter results...",
				"data-type": "search"
			})
			.bind( "keyup change", function() {
				var val = this.value.toLowerCase();;
				list.children().show();
				if ( val ) {
					list.children().filter(function() {
						return $( this ).text().toLowerCase().indexOf( val ) === -1;
					}).hide();
				}
				
				//listview._numberItems();
			})
			.appendTo( wrapper )
			.textinput();
	
	wrapper.insertBefore( list );
});

})( jQuery );
/*
* jQuery Mobile Framework : "dialog" plugin.
* Copyright (c) jQuery Project
* Dual licensed under the MIT (MIT-LICENSE.txt) and GPL (GPL-LICENSE.txt) licenses.
* Note: Code is in draft form and is subject to change 
*/
(function($, undefined ) {
$.widget( "mobile.dialog", $.mobile.widget, {
	options: {},
	_create: function(){	
		var self = this,
			$el = self.element,
			$prevPage = $.mobile.activePage,
			$closeBtn = $('<a href="#" data-icon="delete" data-iconpos="notext">Close</a>');
	
		$el.delegate("a, form", "click submit", function(e){
			if( e.type == "click" && ( $(e.target).closest('[data-back]')[0] || this==$closeBtn[0] ) ){
				self.close();
				return false;
			}
			//otherwise, assume we're headed somewhere new. set activepage to dialog so the transition will work
			$.mobile.activePage = self.element;
		});
	
		this.element
			.bind("pageshow",function(){
				return false;
			})
			//add ARIA role
			.attr("role","dialog")
			.addClass('ui-page ui-dialog ui-body-a')
			.find('[data-role=header]')
			.addClass('ui-corner-top ui-overlay-shadow')
				.prepend( $closeBtn )
			.end()
			.find('.ui-content:not([class*="ui-body-"])')
				.addClass('ui-body-c')
			.end()	
			.find('.ui-content,[data-role=footer]')
				.last()
				.addClass('ui-corner-bottom ui-overlay-shadow');
		
		$(window).bind('hashchange',function(){
			if( $el.is('.ui-page-active') ){
				self.close();
				$el.bind('pagehide',function(){
					$.mobile.updateHash( $prevPage.attr('data-url'), true);
				});
			}
		});		

	},
	
	close: function(){
		$.mobile.changePage([this.element, $.mobile.activePage], undefined, true, true );
	}
});
})( jQuery );/*
* jQuery Mobile Framework : "navbar" plugin
* Copyright (c) jQuery Project
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*/
(function($, undefined ) {
$.widget( "mobile.navbar", $.mobile.widget, {
	options: {
		iconpos: 'top',
		grid: null
	},
	_create: function(){
		var $navbar = this.element,
			$navbtns = $navbar.find("a"),
			iconpos = $navbtns.filter('[data-icon]').length ? this.options.iconpos : undefined;
		
		$navbar
			.addClass('ui-navbar')
			.attr("role","navigation")
			.find("ul")
				.grid({grid: this.options.grid });		
		
		if( !iconpos ){ 
			$navbar.addClass("ui-navbar-noicons");
		}
		
		$navbtns
			.buttonMarkup({
				corners:	false, 
				shadow:		false, 
				iconpos:	iconpos
			});
		
		$navbar.delegate("a", "click",function(event){
			$navbtns.removeClass("ui-btn-active");
		});	
	}
});
})( jQuery );/*
* jQuery Mobile Framework : plugin for creating CSS grids
* Copyright (c) jQuery Project
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*/ 
(function($, undefined ) {
$.fn.grid = function(options){
	return $(this).each(function(){
		var o = $.extend({
			grid: null
		},options);
	
			
		var $kids = $(this).children(),
			gridCols = {a: 2, b:3, c:4, d:5},
			grid = o.grid,
			iterator;
			
			if( !grid ){
				if( $kids.length <= 5 ){
					for(var letter in gridCols){
						if(gridCols[letter] == $kids.length){ grid = letter; }
					}
				}
				else{
					grid = 'a';
				}
			}
			iterator = gridCols[grid];
			
		$(this).addClass('ui-grid-' + grid);
	
		$kids.filter(':nth-child(' + iterator + 'n+1)').addClass('ui-block-a');
		$kids.filter(':nth-child(' + iterator + 'n+2)').addClass('ui-block-b');
			
		if(iterator > 2){	
			$kids.filter(':nth-child(3n+3)').addClass('ui-block-c');
		}	
		if(iterator> 3){	
			$kids.filter(':nth-child(4n+4)').addClass('ui-block-d');
		}	
		if(iterator > 4){	
			$kids.filter(':nth-child(5n+5)').addClass('ui-block-e');
		}
				
	});	
};
})(jQuery);

