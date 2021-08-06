import {Observable} from "@babylonjs/core";

class PeerConnection {
    CHANNEL_NAME = "data"

    _iceServers = [{
        url: 'stun:stun.l.google.com:19302'
      },{
        url: 'stun:stun.anyfirewall.com:3478'
      },{
        url: 'turn:turn.bistri.com:80',
        credential: 'homeo',
        username: 'homeo'
      },{
        url: 'turn:turn.anyfirewall.com:443?transport=tcp',
        credential: 'webrtc',
        username: 'webrtc'
    }];
    
    constructor(socket, user, peerUser, initiator) {
        this._socket = socket;
        this._user = user;
        this._peerUser = peerUser;
        this._initiator = initiator;
        this._remoteDescriptionReady = false;
        this._dataChannelReady = false;
        this._connection = new RTCPeerConnection({
            iceServers: this._iceServers
        });
        this._connection.onicecandidate = e => this._onLocalIceCandidate(e);
        this._connection.ondatachannel = e => this._onDataChannel(e);
        this._pendingCandidates = [];

        if (initiator) {
            this._dataChannel = this._connection.createDataChannel(this.CHANNEL_NAME,{ ordered: false});
            console.log(this._dataChannel);
            this._dataChannel.onopen = e => this._dataChannelStateChange();
            this._dataChannel.onclose = e => this._dataChannelStateChange();
            this._setLocalDescriptionAndSend();
        }

        this.onDataChannelReady = new Observable();
        this.onMessage = new Observable();
    }

    _setLocalDescriptionAndSend() {
        
        var self = this;
        self.getDescription()
          .then(function(localDescription) {
            self._connection.setLocalDescription(localDescription)
              .then(function() {
                console.log('Sending SDP', 'green');
                self._sendSdp(self._peerUser.userId, localDescription);
              });
          })
          .catch(function(error) {
            console.log('onSdpError: ' + error.message, 'red');
          });
      }

      _sendSdp(userId, sdp) {
        this._socket.emit('sdp', {
          userId: userId,
          sdp: sdp
        });
      }

      setSdp(spd) {
          let self = this;
          let remoteDescription = new RTCSessionDescription(spd);
          self._connection.setRemoteDescription(remoteDescription).then(() => {
            self._remoteDescriptionReady = true;

            while (self._pendingCandidates.length) {
                self._addRemoteCandidate(self._pendingCandidates.pop());
              }

            if (!self._initiator) {
                self._setLocalDescriptionAndSend();
            }
            console.log("Got remote SDP");
          }).catch((err) => {
            console.log("Remote SDP failed " + err.message);
          });
      }

      _onLocalIceCandidate(event) {
        if (event.candidate) {
          console.log('Send my ICE-candidate: ' + event.candidate.candidate, 'gray');
          this._sendIceCandidate(this._peerUser.userId, event.candidate);
        } else {
            console.log('No more candidates', 'gray');
        }
      }

      _addRemoteCandidate(candidate) {
        try {
            this._connection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('Added his ICE-candidate:' + candidate.candidate, 'gray');
          } catch (err) {
            console.log('Error adding remote ice candidate' + err.message, 'red');
          }
      }

      addIceCandidate(candidate) {
        if (this._remoteDescriptionReady) {
            this._addRemoteCandidate(candidate);
          } else {
            this._pendingCandidates.push(candidate);
          }
      }

      _sendIceCandidate(userId, candidate) {
        this._socket.emit('ice_candidate', {
          userId: userId,
          candidate: candidate
        });
      }

      getDescription() {
        console.log("desc");
        return this._initiator ?
          this._connection.createOffer() :
          this._connection.createAnswer();
      }

      _onDataChannel(event) {
        if (!this._initiator) {
            console.log("data channel recieved");
            this._dataChannel = event.channel;
            this._dataChannel.onopen = e => this._dataChannelStateChange();
            this._dataChannel.onclose = e => this._dataChannelStateChange();
            this._dataChannel.onmessage = e => this._onMessage(e);
          }
      }

      _onMessage(event) {
          this.onMessage.notifyObservers(event.data);
      }
      sendMessage(message) {
        if (!this._dataChannelReady) {
          return;
        }
        this._dataChannel.send(message);
      }

      _dataChannelStateChange() {
          if (this._dataChannel.readyState === 'open') {
            this._dataChannelReady = true;
            this.onDataChannelReady.notifyObservers('open');
          } else {
            this._dataChannelReady = false;
          } 
          console.log(this._dataChannel.readyState);
      }

      closeDataChannel() {
          this._dataChannel.close();
      }

}

export {PeerConnection}