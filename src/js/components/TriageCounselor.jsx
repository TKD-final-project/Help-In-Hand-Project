/* global io*/
/* global navigator*/
var React = require('react');
var SimplePeer = require('simple-peer');

var LogoutPage = require('./LogoutPage');

var TriageCounselor = React.createClass({
    getInitialState: function() {
        return {};
    },
    componentDidMount: function() {
        var socket = this.socket = io();
        var that = this;

        socket.emit('triage counselor');

        socket.on('start stream', function() {

            that.setState({
                connected: true
            });
            navigator.webkitGetUserMedia({
                video: true,
                audio: false
            }, function(stream) {

                console.log('got media stream');
                var peer = new SimplePeer({
                    initiator: true,
                    trickle: false,
                    stream: stream,
                    config: {
                        iceServers: [{
                            url: 'stun:stun.l.google.com:19302'
                        }]
                    }
                });

                peer.on('signal', function(data) {
                    console.log('received signal');
                    console.log('hi I am a peer ', peer);
                    socket.emit('stream id', data);
                });

                function onConnectPeer(data) {
                    console.log('received connect');
                    peer.signal(data);
                }
                socket.on('connect peer', onConnectPeer);

                function onStopCall() {
                    socket.removeListener('connect peer', onConnectPeer);
                    socket.removeListener('stop call', onStopCall);
                    peer.destroy();
                    console.log('peer got destroyed :( ', peer);
                    var tracks = stream.getTracks();
                    tracks.forEach(function(track) {
                        track.stop();
                    });
                    that.setState({
                        connected: false
                    });
                }

                socket.on('stop call', onStopCall);

                peer.on('stream', function(stream) {
                    console.log('peer data');

                    var video = that.refs.videoPlayer;

                    video.src = window.URL.createObjectURL(stream);
                    video.play();

                });
            }, function(err) {
                console.error(err);
            });
        });


    },
    _handleAssign: function() {
        var priority = this.refs.priorityInput.value;

        this.socket.emit('queue', {
            priority: priority
        });
    },
    _priorityUi: function() {
        return (
            <div>
                <input type="text" ref="priorityInput"/>
                <button onClick={this._handleAssign}>ASSIGN</button>
            </div>
        );
    },
    _connected: function() {
        return (
            <div>
                <p>You are talking to a patient in triage</p>
                <video ref="videoPlayer"/>
                {this._priorityUi()}
            </div>
        );
    },
    _disconnected: function() {
        return (
            <div>
                <p>There are no patients in the queue. Time to browse Reddit!</p>
                <button onClick={this._logout}>logout</button>
            </div>
        );
    },
    _logout: function() {
        console.log('logout button was clicked');
        this.socket.isFree = false;

        console.log('is the socket free ', this.socket.isFree);
        console.log('is there a peer ', this.peer);
        // this.socket.removeListener('connect peer', onConnectPeer);
        // this.socket.removeListener('stop call', onStopCall);
        // this.socket.connected = false;
        console.log('this.socket is ', this.socket);
        console.log('what');
        // var tracks = stream.getTracks();
        // tracks.forEach(function(track) {
        //     track.stop();
        // });
        // this.setState({
        //     logoutButtonClicked: true,
        //     connected: false
        // });
    },
    render: function() {
        return (
            <div>
                {this.state.logoutButtonClicked ? <LogoutPage /> : this.state.connected ? this._connected() : this._disconnected()}
            </div>
        );
    }
});

module.exports = TriageCounselor;