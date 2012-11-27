!function($) {
    "use strict";
    $(function() {
        $.support.transition = function() {
            var transitionEnd = function() {
                var el = document.createElement("bootstrap"), transEndEventNames = {
                    WebkitTransition: "webkitTransitionEnd",
                    MozTransition: "transitionend",
                    OTransition: "oTransitionEnd otransitionend",
                    transition: "transitionend"
                }, name;
                for (name in transEndEventNames) {
                    if (el.style[name] !== undefined) {
                        return transEndEventNames[name];
                    }
                }
            }();
            return transitionEnd && {
                end: transitionEnd
            };
        }();
    });
}(window.jQuery);

!function($) {
    "use strict";
    var dismiss = '[data-dismiss="alert"]', Alert = function(el) {
        $(el).on("click", dismiss, this.close);
    };
    Alert.prototype.close = function(e) {
        var $this = $(this), selector = $this.attr("data-target"), $parent;
        if (!selector) {
            selector = $this.attr("href");
            selector = selector && selector.replace(/.*(?=#[^\s]*$)/, "");
        }
        $parent = $(selector);
        e && e.preventDefault();
        $parent.length || ($parent = $this.hasClass("alert") ? $this : $this.parent());
        $parent.trigger(e = $.Event("close"));
        if (e.isDefaultPrevented()) return;
        $parent.removeClass("in");
        function removeElement() {
            $parent.trigger("closed").remove();
        }
        $.support.transition && $parent.hasClass("fade") ? $parent.on($.support.transition.end, removeElement) : removeElement();
    };
    $.fn.alert = function(option) {
        return this.each(function() {
            var $this = $(this), data = $this.data("alert");
            if (!data) $this.data("alert", data = new Alert(this));
            if (typeof option == "string") data[option].call($this);
        });
    };
    $.fn.alert.Constructor = Alert;
    $(document).on("click.alert.data-api", dismiss, Alert.prototype.close);
}(window.jQuery);

!function($) {
    "use strict";
    var Button = function(element, options) {
        this.$element = $(element);
        this.options = $.extend({}, $.fn.button.defaults, options);
    };
    Button.prototype.setState = function(state) {
        var d = "disabled", $el = this.$element, data = $el.data(), val = $el.is("input") ? "val" : "html";
        state = state + "Text";
        data.resetText || $el.data("resetText", $el[val]());
        $el[val](data[state] || this.options[state]);
        setTimeout(function() {
            state == "loadingText" ? $el.addClass(d).attr(d, d) : $el.removeClass(d).removeAttr(d);
        }, 0);
    };
    Button.prototype.toggle = function() {
        var $parent = this.$element.closest('[data-toggle="buttons-radio"]');
        $parent && $parent.find(".active").removeClass("active");
        this.$element.toggleClass("active");
    };
    $.fn.button = function(option) {
        return this.each(function() {
            var $this = $(this), data = $this.data("button"), options = typeof option == "object" && option;
            if (!data) $this.data("button", data = new Button(this, options));
            if (option == "toggle") data.toggle(); else if (option) data.setState(option);
        });
    };
    $.fn.button.defaults = {
        loadingText: "loading..."
    };
    $.fn.button.Constructor = Button;
    $(document).on("click.button.data-api", "[data-toggle^=button]", function(e) {
        var $btn = $(e.target);
        if (!$btn.hasClass("btn")) $btn = $btn.closest(".btn");
        $btn.button("toggle");
    });
}(window.jQuery);

!function($) {
    "use strict";
    var Carousel = function(element, options) {
        this.$element = $(element);
        this.options = options;
        this.options.slide && this.slide(this.options.slide);
        this.options.pause == "hover" && this.$element.on("mouseenter", $.proxy(this.pause, this)).on("mouseleave", $.proxy(this.cycle, this));
    };
    Carousel.prototype = {
        cycle: function(e) {
            if (!e) this.paused = false;
            this.options.interval && !this.paused && (this.interval = setInterval($.proxy(this.next, this), this.options.interval));
            return this;
        },
        to: function(pos) {
            var $active = this.$element.find(".item.active"), children = $active.parent().children(), activePos = children.index($active), that = this;
            if (pos > children.length - 1 || pos < 0) return;
            if (this.sliding) {
                return this.$element.one("slid", function() {
                    that.to(pos);
                });
            }
            if (activePos == pos) {
                return this.pause().cycle();
            }
            return this.slide(pos > activePos ? "next" : "prev", $(children[pos]));
        },
        pause: function(e) {
            if (!e) this.paused = true;
            if (this.$element.find(".next, .prev").length && $.support.transition.end) {
                this.$element.trigger($.support.transition.end);
                this.cycle();
            }
            clearInterval(this.interval);
            this.interval = null;
            return this;
        },
        next: function() {
            if (this.sliding) return;
            return this.slide("next");
        },
        prev: function() {
            if (this.sliding) return;
            return this.slide("prev");
        },
        slide: function(type, next) {
            var $active = this.$element.find(".item.active"), $next = next || $active[type](), isCycling = this.interval, direction = type == "next" ? "left" : "right", fallback = type == "next" ? "first" : "last", that = this, e;
            this.sliding = true;
            isCycling && this.pause();
            $next = $next.length ? $next : this.$element.find(".item")[fallback]();
            e = $.Event("slide", {
                relatedTarget: $next[0]
            });
            if ($next.hasClass("active")) return;
            if ($.support.transition && this.$element.hasClass("slide")) {
                this.$element.trigger(e);
                if (e.isDefaultPrevented()) return;
                $next.addClass(type);
                $next[0].offsetWidth;
                $active.addClass(direction);
                $next.addClass(direction);
                this.$element.one($.support.transition.end, function() {
                    $next.removeClass([ type, direction ].join(" ")).addClass("active");
                    $active.removeClass([ "active", direction ].join(" "));
                    that.sliding = false;
                    setTimeout(function() {
                        that.$element.trigger("slid");
                    }, 0);
                });
            } else {
                this.$element.trigger(e);
                if (e.isDefaultPrevented()) return;
                $active.removeClass("active");
                $next.addClass("active");
                this.sliding = false;
                this.$element.trigger("slid");
            }
            isCycling && this.cycle();
            return this;
        }
    };
    $.fn.carousel = function(option) {
        return this.each(function() {
            var $this = $(this), data = $this.data("carousel"), options = $.extend({}, $.fn.carousel.defaults, typeof option == "object" && option), action = typeof option == "string" ? option : options.slide;
            if (!data) $this.data("carousel", data = new Carousel(this, options));
            if (typeof option == "number") data.to(option); else if (action) data[action](); else if (options.interval) data.cycle();
        });
    };
    $.fn.carousel.defaults = {
        interval: 5e3,
        pause: "hover"
    };
    $.fn.carousel.Constructor = Carousel;
    $(document).on("click.carousel.data-api", "[data-slide]", function(e) {
        var $this = $(this), href, $target = $($this.attr("data-target") || (href = $this.attr("href")) && href.replace(/.*(?=#[^\s]+$)/, "")), options = $.extend({}, $target.data(), $this.data());
        $target.carousel(options);
        e.preventDefault();
    });
}(window.jQuery);

!function($) {
    "use strict";
    var Collapse = function(element, options) {
        this.$element = $(element);
        this.options = $.extend({}, $.fn.collapse.defaults, options);
        if (this.options.parent) {
            this.$parent = $(this.options.parent);
        }
        this.options.toggle && this.toggle();
    };
    Collapse.prototype = {
        constructor: Collapse,
        dimension: function() {
            var hasWidth = this.$element.hasClass("width");
            return hasWidth ? "width" : "height";
        },
        show: function() {
            var dimension, scroll, actives, hasData;
            if (this.transitioning) return;
            dimension = this.dimension();
            scroll = $.camelCase([ "scroll", dimension ].join("-"));
            actives = this.$parent && this.$parent.find("> .accordion-group > .in");
            if (actives && actives.length) {
                hasData = actives.data("collapse");
                if (hasData && hasData.transitioning) return;
                actives.collapse("hide");
                hasData || actives.data("collapse", null);
            }
            this.$element[dimension](0);
            this.transition("addClass", $.Event("show"), "shown");
            $.support.transition && this.$element[dimension](this.$element[0][scroll]);
        },
        hide: function() {
            var dimension;
            if (this.transitioning) return;
            dimension = this.dimension();
            this.reset(this.$element[dimension]());
            this.transition("removeClass", $.Event("hide"), "hidden");
            this.$element[dimension](0);
        },
        reset: function(size) {
            var dimension = this.dimension();
            this.$element.removeClass("collapse")[dimension](size || "auto")[0].offsetWidth;
            this.$element[size !== null ? "addClass" : "removeClass"]("collapse");
            return this;
        },
        transition: function(method, startEvent, completeEvent) {
            var that = this, complete = function() {
                if (startEvent.type == "show") that.reset();
                that.transitioning = 0;
                that.$element.trigger(completeEvent);
            };
            this.$element.trigger(startEvent);
            if (startEvent.isDefaultPrevented()) return;
            this.transitioning = 1;
            this.$element[method]("in");
            $.support.transition && this.$element.hasClass("collapse") ? this.$element.one($.support.transition.end, complete) : complete();
        },
        toggle: function() {
            this[this.$element.hasClass("in") ? "hide" : "show"]();
        }
    };
    $.fn.collapse = function(option) {
        return this.each(function() {
            var $this = $(this), data = $this.data("collapse"), options = typeof option == "object" && option;
            if (!data) $this.data("collapse", data = new Collapse(this, options));
            if (typeof option == "string") data[option]();
        });
    };
    $.fn.collapse.defaults = {
        toggle: true
    };
    $.fn.collapse.Constructor = Collapse;
    $(document).on("click.collapse.data-api", "[data-toggle=collapse]", function(e) {
        var $this = $(this), href, target = $this.attr("data-target") || e.preventDefault() || (href = $this.attr("href")) && href.replace(/.*(?=#[^\s]+$)/, ""), option = $(target).data("collapse") ? "toggle" : $this.data();
        $this[$(target).hasClass("in") ? "addClass" : "removeClass"]("collapsed");
        $(target).collapse(option);
    });
}(window.jQuery);

!function($) {
    "use strict";
    var toggle = "[data-toggle=dropdown]", Dropdown = function(element) {
        var $el = $(element).on("click.dropdown.data-api", this.toggle);
        $("html").on("click.dropdown.data-api", function() {
            $el.parent().removeClass("open");
        });
    };
    Dropdown.prototype = {
        constructor: Dropdown,
        toggle: function(e) {
            var $this = $(this), $parent, isActive;
            if ($this.is(".disabled, :disabled")) return;
            $parent = getParent($this);
            isActive = $parent.hasClass("open");
            clearMenus();
            if (!isActive) {
                $parent.toggleClass("open");
                $this.focus();
            }
            return false;
        },
        keydown: function(e) {
            var $this, $items, $active, $parent, isActive, index;
            if (!/(38|40|27)/.test(e.keyCode)) return;
            $this = $(this);
            e.preventDefault();
            e.stopPropagation();
            if ($this.is(".disabled, :disabled")) return;
            $parent = getParent($this);
            isActive = $parent.hasClass("open");
            if (!isActive || isActive && e.keyCode == 27) return $this.click();
            $items = $("[role=menu] li:not(.divider) a", $parent);
            if (!$items.length) return;
            index = $items.index($items.filter(":focus"));
            if (e.keyCode == 38 && index > 0) index--;
            if (e.keyCode == 40 && index < $items.length - 1) index++;
            if (!~index) index = 0;
            $items.eq(index).focus();
        }
    };
    function clearMenus() {
        $(toggle).each(function() {
            getParent($(this)).removeClass("open");
        });
    }
    function getParent($this) {
        var selector = $this.attr("data-target"), $parent;
        if (!selector) {
            selector = $this.attr("href");
            selector = selector && /#/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, "");
        }
        $parent = $(selector);
        $parent.length || ($parent = $this.parent());
        return $parent;
    }
    $.fn.dropdown = function(option) {
        return this.each(function() {
            var $this = $(this), data = $this.data("dropdown");
            if (!data) $this.data("dropdown", data = new Dropdown(this));
            if (typeof option == "string") data[option].call($this);
        });
    };
    $.fn.dropdown.Constructor = Dropdown;
    $(document).on("click.dropdown.data-api touchstart.dropdown.data-api", clearMenus).on("click.dropdown touchstart.dropdown.data-api", ".dropdown form", function(e) {
        e.stopPropagation();
    }).on("click.dropdown.data-api touchstart.dropdown.data-api", toggle, Dropdown.prototype.toggle).on("keydown.dropdown.data-api touchstart.dropdown.data-api", toggle + ", [role=menu]", Dropdown.prototype.keydown);
}(window.jQuery);

!function($) {
    "use strict";
    var Modal = function(element, options) {
        this.options = options;
        this.$element = $(element).delegate('[data-dismiss="modal"]', "click.dismiss.modal", $.proxy(this.hide, this));
        this.options.remote && this.$element.find(".modal-body").load(this.options.remote);
    };
    Modal.prototype = {
        constructor: Modal,
        toggle: function() {
            return this[!this.isShown ? "show" : "hide"]();
        },
        show: function() {
            var that = this, e = $.Event("show");
            this.$element.trigger(e);
            if (this.isShown || e.isDefaultPrevented()) return;
            this.isShown = true;
            this.escape();
            this.backdrop(function() {
                var transition = $.support.transition && that.$element.hasClass("fade");
                if (!that.$element.parent().length) {
                    that.$element.appendTo(document.body);
                }
                that.$element.show();
                if (transition) {
                    that.$element[0].offsetWidth;
                }
                that.$element.addClass("in").attr("aria-hidden", false);
                that.enforceFocus();
                transition ? that.$element.one($.support.transition.end, function() {
                    that.$element.focus().trigger("shown");
                }) : that.$element.focus().trigger("shown");
            });
        },
        hide: function(e) {
            e && e.preventDefault();
            var that = this;
            e = $.Event("hide");
            this.$element.trigger(e);
            if (!this.isShown || e.isDefaultPrevented()) return;
            this.isShown = false;
            this.escape();
            $(document).off("focusin.modal");
            this.$element.removeClass("in").attr("aria-hidden", true);
            $.support.transition && this.$element.hasClass("fade") ? this.hideWithTransition() : this.hideModal();
        },
        enforceFocus: function() {
            var that = this;
            $(document).on("focusin.modal", function(e) {
                if (that.$element[0] !== e.target && !that.$element.has(e.target).length) {
                    that.$element.focus();
                }
            });
        },
        escape: function() {
            var that = this;
            if (this.isShown && this.options.keyboard) {
                this.$element.on("keyup.dismiss.modal", function(e) {
                    e.which == 27 && that.hide();
                });
            } else if (!this.isShown) {
                this.$element.off("keyup.dismiss.modal");
            }
        },
        hideWithTransition: function() {
            var that = this, timeout = setTimeout(function() {
                that.$element.off($.support.transition.end);
                that.hideModal();
            }, 500);
            this.$element.one($.support.transition.end, function() {
                clearTimeout(timeout);
                that.hideModal();
            });
        },
        hideModal: function(that) {
            this.$element.hide().trigger("hidden");
            this.backdrop();
        },
        removeBackdrop: function() {
            this.$backdrop.remove();
            this.$backdrop = null;
        },
        backdrop: function(callback) {
            var that = this, animate = this.$element.hasClass("fade") ? "fade" : "";
            if (this.isShown && this.options.backdrop) {
                var doAnimate = $.support.transition && animate;
                this.$backdrop = $('<div class="modal-backdrop ' + animate + '" />').appendTo(document.body);
                this.$backdrop.click(this.options.backdrop == "static" ? $.proxy(this.$element[0].focus, this.$element[0]) : $.proxy(this.hide, this));
                if (doAnimate) this.$backdrop[0].offsetWidth;
                this.$backdrop.addClass("in");
                doAnimate ? this.$backdrop.one($.support.transition.end, callback) : callback();
            } else if (!this.isShown && this.$backdrop) {
                this.$backdrop.removeClass("in");
                $.support.transition && this.$element.hasClass("fade") ? this.$backdrop.one($.support.transition.end, $.proxy(this.removeBackdrop, this)) : this.removeBackdrop();
            } else if (callback) {
                callback();
            }
        }
    };
    $.fn.modal = function(option) {
        return this.each(function() {
            var $this = $(this), data = $this.data("modal"), options = $.extend({}, $.fn.modal.defaults, $this.data(), typeof option == "object" && option);
            if (!data) $this.data("modal", data = new Modal(this, options));
            if (typeof option == "string") data[option](); else if (options.show) data.show();
        });
    };
    $.fn.modal.defaults = {
        backdrop: true,
        keyboard: true,
        show: true
    };
    $.fn.modal.Constructor = Modal;
    $(document).on("click.modal.data-api", '[data-toggle="modal"]', function(e) {
        var $this = $(this), href = $this.attr("href"), $target = $($this.attr("data-target") || href && href.replace(/.*(?=#[^\s]+$)/, "")), option = $target.data("modal") ? "toggle" : $.extend({
            remote: !/#/.test(href) && href
        }, $target.data(), $this.data());
        e.preventDefault();
        $target.modal(option).one("hide", function() {
            $this.focus();
        });
    });
}(window.jQuery);

!function($) {
    "use strict";
    var Tooltip = function(element, options) {
        this.init("tooltip", element, options);
    };
    Tooltip.prototype = {
        constructor: Tooltip,
        init: function(type, element, options) {
            var eventIn, eventOut;
            this.type = type;
            this.$element = $(element);
            this.options = this.getOptions(options);
            this.enabled = true;
            if (this.options.trigger == "click") {
                this.$element.on("click." + this.type, this.options.selector, $.proxy(this.toggle, this));
            } else if (this.options.trigger != "manual") {
                eventIn = this.options.trigger == "hover" ? "mouseenter" : "focus";
                eventOut = this.options.trigger == "hover" ? "mouseleave" : "blur";
                this.$element.on(eventIn + "." + this.type, this.options.selector, $.proxy(this.enter, this));
                this.$element.on(eventOut + "." + this.type, this.options.selector, $.proxy(this.leave, this));
            }
            this.options.selector ? this._options = $.extend({}, this.options, {
                trigger: "manual",
                selector: ""
            }) : this.fixTitle();
        },
        getOptions: function(options) {
            options = $.extend({}, $.fn[this.type].defaults, options, this.$element.data());
            if (options.delay && typeof options.delay == "number") {
                options.delay = {
                    show: options.delay,
                    hide: options.delay
                };
            }
            return options;
        },
        enter: function(e) {
            var self = $(e.currentTarget)[this.type](this._options).data(this.type);
            if (!self.options.delay || !self.options.delay.show) return self.show();
            clearTimeout(this.timeout);
            self.hoverState = "in";
            this.timeout = setTimeout(function() {
                if (self.hoverState == "in") self.show();
            }, self.options.delay.show);
        },
        leave: function(e) {
            var self = $(e.currentTarget)[this.type](this._options).data(this.type);
            if (this.timeout) clearTimeout(this.timeout);
            if (!self.options.delay || !self.options.delay.hide) return self.hide();
            self.hoverState = "out";
            this.timeout = setTimeout(function() {
                if (self.hoverState == "out") self.hide();
            }, self.options.delay.hide);
        },
        show: function() {
            var $tip, inside, pos, actualWidth, actualHeight, placement, tp;
            if (this.hasContent() && this.enabled) {
                $tip = this.tip();
                this.setContent();
                if (this.options.animation) {
                    $tip.addClass("fade");
                }
                placement = typeof this.options.placement == "function" ? this.options.placement.call(this, $tip[0], this.$element[0]) : this.options.placement;
                inside = /in/.test(placement);
                $tip.detach().css({
                    top: 0,
                    left: 0,
                    display: "block"
                }).insertAfter(this.$element);
                pos = this.getPosition(inside);
                actualWidth = $tip[0].offsetWidth;
                actualHeight = $tip[0].offsetHeight;
                switch (inside ? placement.split(" ")[1] : placement) {
                  case "bottom":
                    tp = {
                        top: pos.top + pos.height,
                        left: pos.left + pos.width / 2 - actualWidth / 2
                    };
                    break;

                  case "top":
                    tp = {
                        top: pos.top - actualHeight,
                        left: pos.left + pos.width / 2 - actualWidth / 2
                    };
                    break;

                  case "left":
                    tp = {
                        top: pos.top + pos.height / 2 - actualHeight / 2,
                        left: pos.left - actualWidth
                    };
                    break;

                  case "right":
                    tp = {
                        top: pos.top + pos.height / 2 - actualHeight / 2,
                        left: pos.left + pos.width
                    };
                    break;
                }
                $tip.offset(tp).addClass(placement).addClass("in");
            }
        },
        setContent: function() {
            var $tip = this.tip(), title = this.getTitle();
            $tip.find(".tooltip-inner")[this.options.html ? "html" : "text"](title);
            $tip.removeClass("fade in top bottom left right");
        },
        hide: function() {
            var that = this, $tip = this.tip();
            $tip.removeClass("in");
            function removeWithAnimation() {
                var timeout = setTimeout(function() {
                    $tip.off($.support.transition.end).detach();
                }, 500);
                $tip.one($.support.transition.end, function() {
                    clearTimeout(timeout);
                    $tip.detach();
                });
            }
            $.support.transition && this.$tip.hasClass("fade") ? removeWithAnimation() : $tip.detach();
            return this;
        },
        fixTitle: function() {
            var $e = this.$element;
            if ($e.attr("title") || typeof $e.attr("data-original-title") != "string") {
                $e.attr("data-original-title", $e.attr("title") || "").removeAttr("title");
            }
        },
        hasContent: function() {
            return this.getTitle();
        },
        getPosition: function(inside) {
            return $.extend({}, inside ? {
                top: 0,
                left: 0
            } : this.$element.offset(), {
                width: this.$element[0].offsetWidth,
                height: this.$element[0].offsetHeight
            });
        },
        getTitle: function() {
            var title, $e = this.$element, o = this.options;
            title = $e.attr("data-original-title") || (typeof o.title == "function" ? o.title.call($e[0]) : o.title);
            return title;
        },
        tip: function() {
            return this.$tip = this.$tip || $(this.options.template);
        },
        validate: function() {
            if (!this.$element[0].parentNode) {
                this.hide();
                this.$element = null;
                this.options = null;
            }
        },
        enable: function() {
            this.enabled = true;
        },
        disable: function() {
            this.enabled = false;
        },
        toggleEnabled: function() {
            this.enabled = !this.enabled;
        },
        toggle: function(e) {
            var self = $(e.currentTarget)[this.type](this._options).data(this.type);
            self[self.tip().hasClass("in") ? "hide" : "show"]();
        },
        destroy: function() {
            this.hide().$element.off("." + this.type).removeData(this.type);
        }
    };
    $.fn.tooltip = function(option) {
        return this.each(function() {
            var $this = $(this), data = $this.data("tooltip"), options = typeof option == "object" && option;
            if (!data) $this.data("tooltip", data = new Tooltip(this, options));
            if (typeof option == "string") data[option]();
        });
    };
    $.fn.tooltip.Constructor = Tooltip;
    $.fn.tooltip.defaults = {
        animation: true,
        placement: "top",
        selector: false,
        template: '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
        trigger: "hover",
        title: "",
        delay: 0,
        html: false
    };
}(window.jQuery);

!function($) {
    "use strict";
    var Popover = function(element, options) {
        this.init("popover", element, options);
    };
    Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype, {
        constructor: Popover,
        setContent: function() {
            var $tip = this.tip(), title = this.getTitle(), content = this.getContent();
            $tip.find(".popover-title")[this.options.html ? "html" : "text"](title);
            $tip.find(".popover-content > *")[this.options.html ? "html" : "text"](content);
            $tip.removeClass("fade top bottom left right in");
        },
        hasContent: function() {
            return this.getTitle() || this.getContent();
        },
        getContent: function() {
            var content, $e = this.$element, o = this.options;
            content = $e.attr("data-content") || (typeof o.content == "function" ? o.content.call($e[0]) : o.content);
            return content;
        },
        tip: function() {
            if (!this.$tip) {
                this.$tip = $(this.options.template);
            }
            return this.$tip;
        },
        destroy: function() {
            this.hide().$element.off("." + this.type).removeData(this.type);
        }
    });
    $.fn.popover = function(option) {
        return this.each(function() {
            var $this = $(this), data = $this.data("popover"), options = typeof option == "object" && option;
            if (!data) $this.data("popover", data = new Popover(this, options));
            if (typeof option == "string") data[option]();
        });
    };
    $.fn.popover.Constructor = Popover;
    $.fn.popover.defaults = $.extend({}, $.fn.tooltip.defaults, {
        placement: "right",
        trigger: "click",
        content: "",
        template: '<div class="popover"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'
    });
}(window.jQuery);

!function($) {
    "use strict";
    function ScrollSpy(element, options) {
        var process = $.proxy(this.process, this), $element = $(element).is("body") ? $(window) : $(element), href;
        this.options = $.extend({}, $.fn.scrollspy.defaults, options);
        this.$scrollElement = $element.on("scroll.scroll-spy.data-api", process);
        this.selector = (this.options.target || (href = $(element).attr("href")) && href.replace(/.*(?=#[^\s]+$)/, "") || "") + " .nav li > a";
        this.$body = $("body");
        this.refresh();
        this.process();
    }
    ScrollSpy.prototype = {
        constructor: ScrollSpy,
        refresh: function() {
            var self = this, $targets;
            this.offsets = $([]);
            this.targets = $([]);
            $targets = this.$body.find(this.selector).map(function() {
                var $el = $(this), href = $el.data("target") || $el.attr("href"), $href = /^#\w/.test(href) && $(href);
                return $href && $href.length && [ [ $href.position().top, href ] ] || null;
            }).sort(function(a, b) {
                return a[0] - b[0];
            }).each(function() {
                self.offsets.push(this[0]);
                self.targets.push(this[1]);
            });
        },
        process: function() {
            var scrollTop = this.$scrollElement.scrollTop() + this.options.offset, scrollHeight = this.$scrollElement[0].scrollHeight || this.$body[0].scrollHeight, maxScroll = scrollHeight - this.$scrollElement.height(), offsets = this.offsets, targets = this.targets, activeTarget = this.activeTarget, i;
            if (scrollTop >= maxScroll) {
                return activeTarget != (i = targets.last()[0]) && this.activate(i);
            }
            for (i = offsets.length; i--; ) {
                activeTarget != targets[i] && scrollTop >= offsets[i] && (!offsets[i + 1] || scrollTop <= offsets[i + 1]) && this.activate(targets[i]);
            }
        },
        activate: function(target) {
            var active, selector;
            this.activeTarget = target;
            $(this.selector).parent(".active").removeClass("active");
            selector = this.selector + '[data-target="' + target + '"],' + this.selector + '[href="' + target + '"]';
            active = $(selector).parent("li").addClass("active");
            if (active.parent(".dropdown-menu").length) {
                active = active.closest("li.dropdown").addClass("active");
            }
            active.trigger("activate");
        }
    };
    $.fn.scrollspy = function(option) {
        return this.each(function() {
            var $this = $(this), data = $this.data("scrollspy"), options = typeof option == "object" && option;
            if (!data) $this.data("scrollspy", data = new ScrollSpy(this, options));
            if (typeof option == "string") data[option]();
        });
    };
    $.fn.scrollspy.Constructor = ScrollSpy;
    $.fn.scrollspy.defaults = {
        offset: 10
    };
    $(window).on("load", function() {
        $('[data-spy="scroll"]').each(function() {
            var $spy = $(this);
            $spy.scrollspy($spy.data());
        });
    });
}(window.jQuery);

!function($) {
    "use strict";
    var Tab = function(element) {
        this.element = $(element);
    };
    Tab.prototype = {
        constructor: Tab,
        show: function() {
            var $this = this.element, $ul = $this.closest("ul:not(.dropdown-menu)"), selector = $this.attr("data-target"), previous, $target, e;
            if (!selector) {
                selector = $this.attr("href");
                selector = selector && selector.replace(/.*(?=#[^\s]*$)/, "");
            }
            if ($this.parent("li").hasClass("active")) return;
            previous = $ul.find(".active:last a")[0];
            e = $.Event("show", {
                relatedTarget: previous
            });
            $this.trigger(e);
            if (e.isDefaultPrevented()) return;
            $target = $(selector);
            this.activate($this.parent("li"), $ul);
            this.activate($target, $target.parent(), function() {
                $this.trigger({
                    type: "shown",
                    relatedTarget: previous
                });
            });
        },
        activate: function(element, container, callback) {
            var $active = container.find("> .active"), transition = callback && $.support.transition && $active.hasClass("fade");
            function next() {
                $active.removeClass("active").find("> .dropdown-menu > .active").removeClass("active");
                element.addClass("active");
                if (transition) {
                    element[0].offsetWidth;
                    element.addClass("in");
                } else {
                    element.removeClass("fade");
                }
                if (element.parent(".dropdown-menu")) {
                    element.closest("li.dropdown").addClass("active");
                }
                callback && callback();
            }
            transition ? $active.one($.support.transition.end, next) : next();
            $active.removeClass("in");
        }
    };
    $.fn.tab = function(option) {
        return this.each(function() {
            var $this = $(this), data = $this.data("tab");
            if (!data) $this.data("tab", data = new Tab(this));
            if (typeof option == "string") data[option]();
        });
    };
    $.fn.tab.Constructor = Tab;
    $(document).on("click.tab.data-api", '[data-toggle="tab"], [data-toggle="pill"]', function(e) {
        e.preventDefault();
        $(this).tab("show");
    });
}(window.jQuery);

!function($) {
    "use strict";
    var Typeahead = function(element, options) {
        this.$element = $(element);
        this.options = $.extend({}, $.fn.typeahead.defaults, options);
        this.matcher = this.options.matcher || this.matcher;
        this.sorter = this.options.sorter || this.sorter;
        this.highlighter = this.options.highlighter || this.highlighter;
        this.updater = this.options.updater || this.updater;
        this.$menu = $(this.options.menu).appendTo("body");
        this.source = this.options.source;
        this.shown = false;
        this.listen();
    };
    Typeahead.prototype = {
        constructor: Typeahead,
        select: function() {
            var val = this.$menu.find(".active").attr("data-value");
            this.$element.val(this.updater(val)).change();
            return this.hide();
        },
        updater: function(item) {
            return item;
        },
        show: function() {
            var pos = $.extend({}, this.$element.offset(), {
                height: this.$element[0].offsetHeight
            });
            this.$menu.css({
                top: pos.top + pos.height,
                left: pos.left
            });
            this.$menu.show();
            this.shown = true;
            return this;
        },
        hide: function() {
            this.$menu.hide();
            this.shown = false;
            return this;
        },
        lookup: function(event) {
            var items;
            this.query = this.$element.val();
            if (!this.query || this.query.length < this.options.minLength) {
                return this.shown ? this.hide() : this;
            }
            items = $.isFunction(this.source) ? this.source(this.query, $.proxy(this.process, this)) : this.source;
            return items ? this.process(items) : this;
        },
        process: function(items) {
            var that = this;
            items = $.grep(items, function(item) {
                return that.matcher(item);
            });
            items = this.sorter(items);
            if (!items.length) {
                return this.shown ? this.hide() : this;
            }
            return this.render(items.slice(0, this.options.items)).show();
        },
        matcher: function(item) {
            return ~item.toLowerCase().indexOf(this.query.toLowerCase());
        },
        sorter: function(items) {
            var beginswith = [], caseSensitive = [], caseInsensitive = [], item;
            while (item = items.shift()) {
                if (!item.toLowerCase().indexOf(this.query.toLowerCase())) beginswith.push(item); else if (~item.indexOf(this.query)) caseSensitive.push(item); else caseInsensitive.push(item);
            }
            return beginswith.concat(caseSensitive, caseInsensitive);
        },
        highlighter: function(item) {
            var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
            return item.replace(new RegExp("(" + query + ")", "ig"), function($1, match) {
                return "<strong>" + match + "</strong>";
            });
        },
        render: function(items) {
            var that = this;
            items = $(items).map(function(i, item) {
                i = $(that.options.item).attr("data-value", item);
                i.find("a").html(that.highlighter(item));
                return i[0];
            });
            items.first().addClass("active");
            this.$menu.html(items);
            return this;
        },
        next: function(event) {
            var active = this.$menu.find(".active").removeClass("active"), next = active.next();
            if (!next.length) {
                next = $(this.$menu.find("li")[0]);
            }
            next.addClass("active");
        },
        prev: function(event) {
            var active = this.$menu.find(".active").removeClass("active"), prev = active.prev();
            if (!prev.length) {
                prev = this.$menu.find("li").last();
            }
            prev.addClass("active");
        },
        listen: function() {
            this.$element.on("blur", $.proxy(this.blur, this)).on("keypress", $.proxy(this.keypress, this)).on("keyup", $.proxy(this.keyup, this));
            if (this.eventSupported("keydown")) {
                this.$element.on("keydown", $.proxy(this.keydown, this));
            }
            this.$menu.on("click", $.proxy(this.click, this)).on("mouseenter", "li", $.proxy(this.mouseenter, this));
        },
        eventSupported: function(eventName) {
            var isSupported = eventName in this.$element;
            if (!isSupported) {
                this.$element.setAttribute(eventName, "return;");
                isSupported = typeof this.$element[eventName] === "function";
            }
            return isSupported;
        },
        move: function(e) {
            if (!this.shown) return;
            switch (e.keyCode) {
              case 9:
              case 13:
              case 27:
                e.preventDefault();
                break;

              case 38:
                e.preventDefault();
                this.prev();
                break;

              case 40:
                e.preventDefault();
                this.next();
                break;
            }
            e.stopPropagation();
        },
        keydown: function(e) {
            this.suppressKeyPressRepeat = !~$.inArray(e.keyCode, [ 40, 38, 9, 13, 27 ]);
            this.move(e);
        },
        keypress: function(e) {
            if (this.suppressKeyPressRepeat) return;
            this.move(e);
        },
        keyup: function(e) {
            switch (e.keyCode) {
              case 40:
              case 38:
              case 16:
              case 17:
              case 18:
                break;

              case 9:
              case 13:
                if (!this.shown) return;
                this.select();
                break;

              case 27:
                if (!this.shown) return;
                this.hide();
                break;

              default:
                this.lookup();
            }
            e.stopPropagation();
            e.preventDefault();
        },
        blur: function(e) {
            var that = this;
            setTimeout(function() {
                that.hide();
            }, 150);
        },
        click: function(e) {
            e.stopPropagation();
            e.preventDefault();
            this.select();
        },
        mouseenter: function(e) {
            this.$menu.find(".active").removeClass("active");
            $(e.currentTarget).addClass("active");
        }
    };
    $.fn.typeahead = function(option) {
        return this.each(function() {
            var $this = $(this), data = $this.data("typeahead"), options = typeof option == "object" && option;
            if (!data) $this.data("typeahead", data = new Typeahead(this, options));
            if (typeof option == "string") data[option]();
        });
    };
    $.fn.typeahead.defaults = {
        source: [],
        items: 8,
        menu: '<ul class="typeahead dropdown-menu"></ul>',
        item: '<li><a href="#"></a></li>',
        minLength: 1
    };
    $.fn.typeahead.Constructor = Typeahead;
    $(document).on("focus.typeahead.data-api", '[data-provide="typeahead"]', function(e) {
        var $this = $(this);
        if ($this.data("typeahead")) return;
        e.preventDefault();
        $this.typeahead($this.data());
    });
}(window.jQuery);

!function($) {
    "use strict";
    var Affix = function(element, options) {
        this.options = $.extend({}, $.fn.affix.defaults, options);
        this.$window = $(window).on("scroll.affix.data-api", $.proxy(this.checkPosition, this)).on("click.affix.data-api", $.proxy(function() {
            setTimeout($.proxy(this.checkPosition, this), 1);
        }, this));
        this.$element = $(element);
        this.checkPosition();
    };
    Affix.prototype.checkPosition = function() {
        if (!this.$element.is(":visible")) return;
        var scrollHeight = $(document).height(), scrollTop = this.$window.scrollTop(), position = this.$element.offset(), offset = this.options.offset, offsetBottom = offset.bottom, offsetTop = offset.top, reset = "affix affix-top affix-bottom", affix;
        if (typeof offset != "object") offsetBottom = offsetTop = offset;
        if (typeof offsetTop == "function") offsetTop = offset.top();
        if (typeof offsetBottom == "function") offsetBottom = offset.bottom();
        affix = this.unpin != null && scrollTop + this.unpin <= position.top ? false : offsetBottom != null && position.top + this.$element.height() >= scrollHeight - offsetBottom ? "bottom" : offsetTop != null && scrollTop <= offsetTop ? "top" : false;
        if (this.affixed === affix) return;
        this.affixed = affix;
        this.unpin = affix == "bottom" ? position.top - scrollTop : null;
        this.$element.removeClass(reset).addClass("affix" + (affix ? "-" + affix : ""));
    };
    $.fn.affix = function(option) {
        return this.each(function() {
            var $this = $(this), data = $this.data("affix"), options = typeof option == "object" && option;
            if (!data) $this.data("affix", data = new Affix(this, options));
            if (typeof option == "string") data[option]();
        });
    };
    $.fn.affix.Constructor = Affix;
    $.fn.affix.defaults = {
        offset: 0
    };
    $(window).on("load", function() {
        $('[data-spy="affix"]').each(function() {
            var $spy = $(this), data = $spy.data();
            data.offset = data.offset || {};
            data.offsetBottom && (data.offset.bottom = data.offsetBottom);
            data.offsetTop && (data.offset.top = data.offsetTop);
            $spy.affix(data);
        });
    });
}(window.jQuery);

$(document).ready(function() {
    $("#project").change(changeIfNew);
    $("#task-form-section form").submit(newTask);
    $(document).on("click", ".starter", start);
    $(document).on("click", ".stoper", stop);
    $(document).on("click", ".deleter", remove);
    $(".stoper").each(function() {
        var $tr = $(this).parent().parent();
        var $that = $(this);
        var p = $tr.find(".project").text();
        var n = $tr.find(".name").text();
        var h = $tr.find(".hour");
        if (!counter[p]) {
            counter[p] = {};
        }
        counter[p][n] = 1;
        setTimeout(function() {
            count(h, p, n);
        }, 1e3);
        counting = 1;
    });
    totalCounter = $("#dailyhours .total");
    todayCounter = $("#dailyhours .today");
    setTimeout(countDay, 1e3);
});

var totalCounter;

var todayCounter;

var counting = 0;

var newProject = 0;

var counter = {};

function updateTime(e) {
    var matches = /(\d+):(\d\d):(\d\d)/.exec(e.text());
    var h = parseInt(matches[1], 10);
    var m = parseInt(matches[2], 10);
    var s = parseInt(matches[3], 10);
    if (s == 59) {
        s = 0;
        if (m == 59) {
            m = 0;
            h += 1;
        } else {
            m += 1;
        }
    } else {
        s += 1;
    }
    h < 10 && (h = "0" + h);
    m < 10 && (m = "0" + m);
    s < 10 && (s = "0" + s);
    e.text(h + ":" + m + ":" + s);
}

function countDay() {
    if (counting) {
        updateTime(totalCounter);
        updateTime(todayCounter);
    }
    setTimeout(countDay, 1e3);
}

function count(e, p, n) {
    if (counter[p] && counter[p][n] && counter[p][n] == 1) {
        updateTime(e);
        setTimeout(function() {
            count(e, p, n);
        }, 1e3);
    } else if (counter[p] && counter[p][n]) {
        delete counter[p][n];
    }
}

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
    $.getJSON("/" + p + "/" + n, {
        method: "start"
    }, function(data) {
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
    setTimeout(function() {
        count(h, p, n);
    }, 1e3);
}

function stop() {
    $(this).removeClass("stoper");
    $(this).addClass("starter");
    $(this).text("Start");
    var $tr = $(this).parent().parent();
    var $that = $(this);
    var p = $tr.find(".project").text();
    var n = $tr.find(".name").text();
    var h = $tr.find(".hour");
    $.getJSON("/" + p + "/" + n, {
        method: "stop"
    }, function(data) {
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
}

function remove() {
    var $td = $(this).parent();
    var $tr = $td.parent();
    var p = $tr.find(".project").text();
    var n = $tr.find(".name").text();
    $td.html("");
    $.getJSON("/" + p + "/" + n, {
        method: "delete"
    }, function(data) {
        if (data.error == 1) {
            error(data.data);
            return;
        }
        $tr.remove();
    });
}

function changeIfNew(evt) {
    if ($(this).val() == "new") {
        $(this).hide();
        $("#newproject").show();
        newProject = 1;
    }
}

function newTask(evt) {
    evt.preventDefault();
    var p;
    if (newProject) {
        p = $("#newproject").val();
    } else {
        p = $("#project").val();
    }
    if (p == "all" || p == "new") {
        error("No way to create task for All");
        return false;
    }
    var n = $("#newtask").val();
    var d = $("#newdescr").val();
    $.getJSON("/" + p + "/" + n, {
        descr: d
    }, function(data) {
        if (data.error == 1) {
            error(data.data);
            return;
        }
        if (newProject) {
            $("#project").append($('<option value="' + p + '">' + p + "</option>"));
            $("#newproject").hide();
            $("#project").val(p);
            $("#project").show();
            newProject = 0;
        }
        $("#tasks").append($("<tr>" + '<td><button class="btn changer starter" value="start">Start</button></td>' + '<td class="name">' + n + "</td>" + '<td class="project">' + p + "</td>" + '<td class="descr">' + d + "</td>" + '<td class="hour">' + data.data + "</td>" + '<td><button class="btn deleter" value="delete">Delete</button></td>' + "</tr>")).find(".starter").click();
    });
    return false;
}

function error(string) {
    $("#error").css({
        visibility: "visible"
    });
    $("#error").css({
        display: "block"
    });
    $("#error").text(string);
    setTimeout(function() {
        $("#error").text("");
        $("#error").css({
            visibility: "hidden"
        });
        $("#error").css({
            display: "none"
        });
    }, 5e3);
}

