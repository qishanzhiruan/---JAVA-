"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _utils = require("../utils");

var _event = require("../utils/dom/event");

var _scroll = require("../utils/dom/scroll");

var _touch = require("../mixins/touch");

var _loading = _interopRequireDefault(require("../loading"));

// Utils
// Mixins
// Components
var _createNamespace = (0, _utils.createNamespace)('pull-refresh'),
    createComponent = _createNamespace[0],
    bem = _createNamespace[1],
    t = _createNamespace[2];

var DEFAULT_HEAD_HEIGHT = 50;
var TEXT_STATUS = ['pulling', 'loosing', 'success'];

var _default = createComponent({
  mixins: [_touch.TouchMixin],
  props: {
    disabled: Boolean,
    successText: String,
    pullingText: String,
    loosingText: String,
    loadingText: String,
    value: {
      type: Boolean,
      required: true
    },
    successDuration: {
      type: [Number, String],
      default: 500
    },
    animationDuration: {
      type: [Number, String],
      default: 300
    },
    headHeight: {
      type: [Number, String],
      default: DEFAULT_HEAD_HEIGHT
    }
  },
  data: function data() {
    return {
      status: 'normal',
      distance: 0,
      duration: 0
    };
  },
  computed: {
    touchable: function touchable() {
      return this.status !== 'loading' && this.status !== 'success' && !this.disabled;
    },
    headStyle: function headStyle() {
      if (this.headHeight !== DEFAULT_HEAD_HEIGHT) {
        return {
          height: this.headHeight + "px"
        };
      }
    }
  },
  watch: {
    value: function value(loading) {
      this.duration = this.animationDuration;

      if (loading) {
        this.setStatus(+this.headHeight, true);
      } else if (this.slots('success') || this.successText) {
        this.showSuccessTip();
      } else {
        this.setStatus(0, false);
      }
    }
  },
  mounted: function mounted() {
    this.bindTouchEvent(this.$refs.track);
    this.scrollEl = (0, _scroll.getScroller)(this.$el);
  },
  methods: {
    checkPullStart: function checkPullStart(event) {
      this.ceiling = (0, _scroll.getScrollTop)(this.scrollEl) === 0;

      if (this.ceiling) {
        this.duration = 0;
        this.touchStart(event);
      }
    },
    onTouchStart: function onTouchStart(event) {
      if (this.touchable) {
        this.checkPullStart(event);
      }
    },
    onTouchMove: function onTouchMove(event) {
      if (!this.touchable) {
        return;
      }

      if (!this.ceiling) {
        this.checkPullStart(event);
      }

      this.touchMove(event);

      if (this.ceiling && this.deltaY >= 0 && this.direction === 'vertical') {
        (0, _event.preventDefault)(event);
        this.setStatus(this.ease(this.deltaY));
      }
    },
    onTouchEnd: function onTouchEnd() {
      var _this = this;

      if (this.touchable && this.ceiling && this.deltaY) {
        this.duration = this.animationDuration;

        if (this.status === 'loosing') {
          this.setStatus(+this.headHeight, true);
          this.$emit('input', true); // ensure value change can be watched

          this.$nextTick(function () {
            _this.$emit('refresh');
          });
        } else {
          this.setStatus(0);
        }
      }
    },
    ease: function ease(distance) {
      var headHeight = +this.headHeight;

      if (distance > headHeight) {
        if (distance < headHeight * 2) {
          distance = headHeight + (distance - headHeight) / 2;
        } else {
          distance = headHeight * 1.5 + (distance - headHeight * 2) / 4;
        }
      }

      return Math.round(distance);
    },
    setStatus: function setStatus(distance, isLoading) {
      var status;

      if (isLoading) {
        status = 'loading';
      } else if (distance === 0) {
        status = 'normal';
      } else {
        status = distance < this.headHeight ? 'pulling' : 'loosing';
      }

      this.distance = distance;

      if (status !== this.status) {
        this.status = status;
      }
    },
    genStatus: function genStatus() {
      var h = this.$createElement;
      var status = this.status,
          distance = this.distance;
      var slot = this.slots(status, {
        distance: distance
      });

      if (slot) {
        return slot;
      }

      var nodes = [];
      var text = this[status + "Text"] || t(status);

      if (TEXT_STATUS.indexOf(status) !== -1) {
        nodes.push(h("div", {
          "class": bem('text')
        }, [text]));
      }

      if (status === 'loading') {
        nodes.push(h(_loading.default, {
          "attrs": {
            "size": "16"
          }
        }, [text]));
      }

      return nodes;
    },
    showSuccessTip: function showSuccessTip() {
      var _this2 = this;

      this.status = 'success';
      setTimeout(function () {
        _this2.setStatus(0);
      }, this.successDuration);
    }
  },
  render: function render() {
    var h = arguments[0];
    var trackStyle = {
      transitionDuration: this.duration + "ms",
      transform: this.distance ? "translate3d(0," + this.distance + "px, 0)" : ''
    };
    return h("div", {
      "class": bem()
    }, [h("div", {
      "ref": "track",
      "class": bem('track'),
      "style": trackStyle
    }, [h("div", {
      "class": bem('head'),
      "style": this.headStyle
    }, [this.genStatus()]), this.slots()])]);
  }
});

exports.default = _default;