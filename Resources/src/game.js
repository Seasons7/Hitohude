/****************************************************************************
 Copyright (c) 2010-2012 cocos2d-x.org
 Copyright (c) 2008-2010 Ricardo Quesada
 Copyright (c) 2011      Zynga Inc.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

var audioEngine = cc.AudioEngine.getInstance();
var TitleLayer = cc.Layer.extend({

    init: function() {

        this._super();

        this.setTouchEnabled(true);

        var node = cc.BuilderReader.load(s_titlescene_ccbi, this);
        if (node) {
            this.addChild(node);
        }
    },

    onTouchesBegan: function() {

        var director = cc.Director.getInstance();
        var scene = cc.Scene.create();
        var layer = new GameLayer();
        scene.addChild(layer);
        var transition = cc.TransitionFade.create(1.0, scene, cc.c3b(255, 255, 255));
        director.replaceScene(transition);
    }

});

var boards_info = {

    cols: 6,
    rows: 6,
    data: [],
    sprites: []
};

PANEL_TYPE = {
    EMPTY: 0,
    WHITE: 1,
    BLACK: 2,
};

PANEL_TAG_BASE = 0x10;
PANEL_F_TAG_BASE = 0x20;
PANEL_BASE_POS = cc.p(57, 390);
PANEL_SIZE = cc.size(0, 0);

boards_info.data = [
    0, 0, 0, 0, 0, 0,
    0, 1, 1, 2, 1, 0,
    0, 2, 2, 1, 2, 0,
    0, 1, 1, 2, 2, 0,
    0, 2, 1, 2, 2, 0,
    0, 0, 0, 0, 0, 0,
];

boards_info.result_data = [
    0, 0, 0, 0, 0, 0,
    0, 1, 1, 2, 1, 0,
    0, 2, 2, 1, 2, 0,
    0, 1, 1, 2, 2, 0,
    0, 2, 1, 2, 2, 0,
    0, 0, 0, 0, 0, 0,
];

boards_info.marker = [
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
];
boards_info.flip_list = [];
boards_info.current_marker = -1;
boards_info.move_lock = false;

var ModalLayer = cc.Layer.extend({

    ctor: function() {
        this._super();
    },

    onEnter: function() {
        cc.registerTargetedDelegate(1, true, this);
        this._super();
    },

    onExit: function() {
        cc.unregisterTouchDelegate(this);
        this._super();
    },

    onTouchBegan: function( /*touch, event*/ ) {
        cc.log("touch");
        return true; /* 下のオブジェクトにもタッチ処理を流すには、false */
    },

});

var StartDialogLayer = ModalLayer.extend({

    ctor: function() {
        this._super();

        this.layer = cc.LayerGradient.create(
            cc.c4b(20, 20, 20, 128),
            cc.c4b(20, 20, 20, 128),
            cc.p(0.1, 0.1));
        this.addChild(this.layer);

        var size = cc.Director.getInstance().getWinSize();

        this.title = cc.LabelTTF.create("Touch to start!!", "Helvetica-Bold", 32);
        this.addChild(this.title);
        this.title.setTag(1);
        this.title.setPosition(cc.p(size.width / 2, size.height / 2));
    },

    onTouchBegan: function() {

        var time = 1.0;

        var action = cc.Spawn.create(
            cc.FadeTo.create(time, 0),
            cc.ScaleTo.create(time, 1.4, 1.4)
        );
        var action2 = cc.FadeTo.create(time, 0);
        var seq = cc.Sequence.create(action,
            cc.CallFunc.create(function() {
                this.removeFromParent();
            }, this));
        this.title.runAction(seq);
        this.layer.runAction(action2);
        return this._super();
    }

});

var ClearDialogLayer = ModalLayer.extend({

    ctor: function() {
        this._super();

        this.layer = cc.LayerGradient.create(
            cc.c4b(20, 20, 20, 128),
            cc.c4b(20, 20, 20, 128),
            cc.p(0.1, 0.1));
        this.addChild(this.layer);

        var size = cc.Director.getInstance().getWinSize();

        this.title = cc.LabelTTF.create("Solved!!", "Helvetica-Bold", 32);
        this.addChild(this.title);
        this.title.setTag(1);
        this.title.setPosition(cc.p(size.width / 2, size.height / 2));

        this.title.setOpacity(0);
        this.layer.setOpacity(0);
    },

    onEnter: function() {
        this._super();

        var time = 1.0;

        this.layer.runAction(cc.FadeTo.create(time, 255));
        this.title.runAction(cc.FadeTo.create(time, 255));
    }

});

var FailDialogLayer = ModalLayer.extend({

    ctor: function() {
        this._super();

        this.layer = cc.LayerGradient.create(
            cc.c4b(20, 20, 20, 128),
            cc.c4b(20, 20, 20, 128),
            cc.p(0.1, 0.1));
        this.addChild(this.layer);

        var size = cc.Director.getInstance().getWinSize();

        this.title = cc.LabelTTF.create("Fail...", "Helvetica-Bold", 32);
        this.addChild(this.title);
        this.title.setTag(1);
        this.title.setPosition(cc.p(size.width / 2, size.height / 2));

        this.title.setOpacity(0);
        this.layer.setOpacity(0);
    },

    onEnter: function() {
        this._super();

        var time = 1.0;

        this.layer.runAction(cc.FadeTo.create(time, 255));
        this.title.runAction(cc.FadeTo.create(time, 255));
    }
});

var Panel = cc.Node.extend({

    tag: {
        WHITE: 1,
        BLACK: 2
    },
    face: PANEL_TYPE.WHITE,
    flip1stAction: null,
    flip2ndAction: null,
    isFlipping: false,

    ctor: function(type) {

        if (type === undefined) {
            throw new Error("type is undefined");
        }

        this._super();

        this.face = type;

        cc.SpriteFrameCache.getInstance().addSpriteFrames(s_game_objects);

        var white = cc.Sprite.createWithSpriteFrameName("block_w.png");
        var black = cc.Sprite.createWithSpriteFrameName("block_b.png");
        white.setTag(this.tag.WHITE);
        black.setTag(this.tag.BLACK);
        this.addChild(white);
        this.addChild(black);

        if (type == PANEL_TYPE.WHITE) {
            black.setVisible(false);
        } else {
            white.setVisible(false);
        }

        var hide = cc.Hide.create();
        var func = cc.CallFunc.create(this._flip1stEnded, this);
        var camera = cc.OrbitCamera.create(0.15, 1, 0, 0, 90, 0, 0);
        this.flip1stAction = cc.Sequence.create(camera, hide, func);
        this.flip1stAction.retain();

        var show = cc.Show.create();
        var func2 = cc.CallFunc.create(this._flip2ndEnded, this);
        var camera2 = cc.OrbitCamera.create(0.15, 1, 0, 270, 90, 0, 0);
        this.flip2ndAction = cc.Sequence.create(show, camera2, func2);
        this.flip2ndAction.retain();
    },

    faceSprite: function() {

        return (this.face == PANEL_TYPE.WHITE) ?
            this.getChildByTag(this.tag.WHITE) :
            this.getChildByTag(this.tag.BLACK);
    },

    flip: function() {

        if (this.isFlipping)
            return;

        var tag = 0;
        tag = (this.face == PANEL_TYPE.WHITE) ? this.tag.WHITE : this.tag.BLACK;
        var sp = this.getChildByTag(tag);
        if (sp) {
            sp.runAction(this.flip1stAction);
            this.isFlipping = true;
            var flipface = (this.face == PANEL_TYPE.WHITE) ? this.tag.BLACK : this.tag.WHITE;
            this.face = flipface;
        } else {
            throw new Error("Sprite is not found");
        }
    },

    _flip1stEnded: function() {

        tag = (this.face == PANEL_TYPE.WHITE) ? this.tag.WHITE : this.tag.BLACK;
        var sp = this.getChildByTag(tag);
        if (sp) {
            sp.runAction(this.flip2ndAction);
        } else {
            throw new Error("Sprite is not found");
        }
    },

    _flip2ndEnded: function() {

        this.isFlipping = false;
    },

    onExit: function() {
        this._super();
        this.flip1stAction.release();
        this.flip2ndAction.release();
    }


});

var GameLayer = cc.Layer.extend({

    isMouseDown: false,
    helloImg: null,
    helloLabel: null,
    circle: null,
    sprite: null,
    isChecking: false,

    initResource: function() {

        cc.SpriteFrameCache.getInstance().addSpriteFrames(s_game_objects);
        // var right = cc.Sprite.createWithSpriteFrameName("crystals/4.png");
    },

    ctor: function() {
        this._super();
        this.init();
    },

    initBGM: function() {

        // audioEngine.playMusic(s_bgm, true);
    },

    init: function() {

        this.initBGM();
        this.setTouchEnabled(true);

        this.initResource();
        this.initBackground();
        this.initBoard();
        this.resetBoard();

        var s = new StartDialogLayer();
        this.addChild(s);
    },

    initBackground: function() {
        var node = cc.BuilderReader.load(s_gamescene_ccbi, this);
        if (node) {
            this.addChild(node);
        }
    },

    findPanelID: function(touchPos) {

        if (PANEL_SIZE.width === 0 && PANEL_SIZE.height === 0) {
            throw new Error("PANEL_SIZE is 0");
        }

        var __NotFound__ = -1;
        var basePos = PANEL_BASE_POS;
        var pos = cc.p(
            touchPos.x - (basePos.x - PANEL_SIZE.width / 2), -touchPos.y + (basePos.y + PANEL_SIZE.height / 2));

        var x = parseInt(pos.x / PANEL_SIZE.width, 10);
        var y = parseInt(pos.y / PANEL_SIZE.height, 10);
        var no = y * boards_info.cols + x;

        if (boards_info.cols <= x) {
            return __NotFound__;
        }
        if (boards_info.rows <= y) {
            return __NotFound__;
        }

        if (0 <= no && no < (boards_info.cols * boards_info.rows)) {
            return no;
        }
        return __NotFound__;
    },

    initBoard: function() {

        function createNormalPanel() {
            return cc.Sprite.createWithSpriteFrameName("block_n.png");
        }

        var basePos = PANEL_BASE_POS;
        var isInitPanelSize = false;

        for (var y = 0; y < boards_info.rows; y++) {
            for (var x = 0; x < boards_info.cols; x++) {
                var npanel = createNormalPanel();
                var rc = npanel.getTextureRect();
                if (isInitPanelSize === false) {
                    PANEL_SIZE = rc;
                }
                npanel.setPosition(
                    cc.p(basePos.x + rc.width * x,
                        basePos.y - rc.height * y));
                this.addChild(npanel);
                var no = y * boards_info.cols + x;
                var panelID = boards_info.data[no];
                if (panelID == PANEL_TYPE.EMPTY) {
                    npanel.setTag(PANEL_TAG_BASE + no);
                }
            }
        }

    },

    flipPanel: function(sender, no) {

        var p = this.getChildByTag(PANEL_TAG_BASE + no);
        p.flip();
        // audioEngine.playEffect(s_click);
    },

    removeFrame: function(sender, no) {

        var p = this.getChildByTag(PANEL_TAG_BASE + no);
        var frm = p.getChildByTag(PANEL_F_TAG_BASE);
        var f = cc.FadeTo.create(0.2, 0);
        var f2 = cc.CallFunc.create(frm.removeFromParent, frm);
        var seq = cc.Sequence.create(f, f2);
        if (frm) {
            frm.runAction(seq);
        }
    },

    checkSolve: function() {

        cc.log("Check!!");
        this.isChecking = false;

        var cols = (boards_info.cols - 2);
        var rows = (boards_info.rows - 2);
        var offsx = 7;
        var offsy = 2;
        var isSolved = true;
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                var no = y * cols + x;
                no += offsx + y * offsy;
                value = boards_info.result_data[no];
                if (value == PANEL_TYPE.BLACK) {
                    isSolved = false;
                    break;
                }
            }
        }

        if (isSolved) {

            var clear = new ClearDialogLayer();
            this.addChild(clear);

        } else {

            var fail = new FailDialogLayer();
            this.addChild(fail);
        }
    },

    clearMarkers: function() {

        var cols = boards_info.cols;
        var rows = boards_info.rows;
        var flip_actions = [];

        for (var i = 0; i < cols * rows; i++) {
            if (boards_info.marker[i] == 1) {
                this.setMarker(i, 0, cc.c3b(0xff, 0xff, 0xff));
            }
        }

        for (i = 0; i < boards_info.flip_list.length; i++) {
            var no = boards_info.flip_list[i];
            if (boards_info.data[no] == PANEL_TYPE.EMPTY) {
                var f = cc.CallFunc.create(this.removeFrame, this, no);
                var s = cc.Sequence.create(cc.DelayTime.create(0.3), f);
                flip_actions.push(s);
            } else {
                var f1 = cc.CallFunc.create(this.removeFrame, this, no);
                var f2 = cc.CallFunc.create(this.flipPanel, this, no);
                var s1 = cc.Sequence.create(cc.DelayTime.create(0.2), f1, cc.DelayTime.create(0.1), f2);
                flip_actions.push(s1);
            }
        }
        if (flip_actions.length > 0) {
            flip_actions.push(cc.CallFunc.create(function() {
                this.checkSolve();
            }, this));
            var seq = cc.Sequence.create(flip_actions);
            this.runAction(seq);
            boards_info.flip_list = [];
        }
    },

    resetBoard: function() {

        var basePos = PANEL_BASE_POS;
        var cols = boards_info.cols;
        var rows = boards_info.rows;

        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                var no = y * cols + x;
                var panelID = boards_info.data[no];
                if (panelID == PANEL_TYPE.EMPTY) {

                } else {
                    var panel = new Panel(panelID);
                    var rc = panel.faceSprite().getTextureRect();
                    panel.setPosition(
                        cc.p(basePos.x + rc.width * x,
                            basePos.y - rc.height * y));
                    this.addChild(panel);
                    panel.setTag(PANEL_TAG_BASE + no);
                }
            }
        }
    },

    setMarker: function(no, flg) {

        if (no == (-1))
            return;
        if (boards_info.marker[no] != flg) {
            boards_info.marker[no] = flg;

            var frm;
            if (flg == 1) {
                frm = cc.Sprite.createWithSpriteFrameName("block_frm.png");
                frm.setTag(PANEL_F_TAG_BASE);
            }

            if (boards_info.data[no] == PANEL_TYPE.EMPTY) {
                var s = this.getChildByTag(PANEL_TAG_BASE + no);
                if (s) {
                    // s.setColor(color3b);
                    if (flg == 1) {
                        var rc = frm.getTextureRect();
                        frm.setPosition(cc.p(rc.width / 2, rc.height / 2));
                        s.addChild(frm);
                        boards_info.flip_list.push(no);
                    }
                }
            } else {
                boards_info.result_data[no] = (boards_info.data[no] == PANEL_TYPE.BLACK) ?
                    PANEL_TYPE.WHITE : PANEL_TYPE.BLACK;
                var _p = this.getChildByTag(PANEL_TAG_BASE + no);
                if (_p) {
                    // p.faceSprite().setColor(color3b);
                    if (flg == 1) {
                        _p.addChild(frm);
                        boards_info.flip_list.push(no);
                    }
                }
            }
        }
    },

    onTouchesBegan: function(touches) {

        if (this.isChecking === true)
            return;

        var no = this.findPanelID(touches[0].getLocation());
        if (no == (-1))
            return;
        this.setMarker(no, 1);
        boards_info.current_marker = no;
    },

    onTouchesMoved: function(touches) {
        if (this.isChecking === true)
            return;
        var no = this.findPanelID(touches[0].getLocation());
        if (no == (-1))
            return;
        if (boards_info.marker[no] === 0) {
            var fx = (boards_info.current_marker % boards_info.cols);
            var fy = parseInt(boards_info.current_marker / boards_info.cols, 10);
            var tx = (no % boards_info.cols);
            var ty = parseInt(no / boards_info.cols, 10);
            var dx = Math.abs(tx - fx);
            var dy = Math.abs(ty - fy);
            if (dx <= 1 && dy <= 1 && Math.abs(dx - dy) == 1) {
                boards_info.current_marker = no;
                this.setMarker(no, 1);
            }
        }
    },

    onTouchesEnded: function( /*touches*/ ) {
        if (boards_info.current_marker == (-1))
            return;
        this.isChecking = true;
        this.clearMarkers();
    }

});

var MyScene = cc.Scene.extend({
    onEnter: function() {
        this._super();
        var layer = new TitleLayer();
        this.addChild(layer);
        layer.init();
    }
});