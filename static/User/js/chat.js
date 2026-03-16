      document.addEventListener("DOMContentLoaded", function () {

        /* ==============================
            GLOBAL VARIABLES
        ============================== */

        const statusCircle = document.getElementById("statusCircle");
        const statusImage = document.getElementById("statusImage");
        const statusFile = document.getElementById("statusFile");
        const statusUploadBtn = document.getElementById("statusUploadBtn");
        const statusViewer = document.getElementById("statusViewer");
        const statusContent = document.getElementById("statusContent");

        let backendStatus = window.backendStatus || [];
        let currentStatus = 0;
        let statusTimer;


        /* ==============================
            STATUS RENDER
        ============================== */

        function renderStatus() {

          statusCircle.innerHTML = "";

          if (!backendStatus || backendStatus.length === 0) {
            statusImage.style.display = "none";
            statusCircle.style.display = "none";
            return;
          }

          statusImage.style.display = "block";
          statusCircle.style.display = "block";

          const latestStatus = backendStatus[0];
          statusImage.src = "/static/status/" + latestStatus.file;

          const radius = 30;
          const cx = 35;
          const cy = 35;
          const total = backendStatus.length;
          const gap = 4;
          const circumference = 2 * Math.PI * radius;

          backendStatus.forEach((s, i) => {

            const segmentAngle = 360 / total;
            const dash = ((segmentAngle - gap) / 360) * circumference;
            const gapDash = circumference;

            const circle = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "circle"
            );

            circle.setAttribute("r", radius);
            circle.setAttribute("cx", cx);
            circle.setAttribute("cy", cy);
            circle.setAttribute("fill", "none");
            circle.setAttribute("stroke", "#25d366");
            circle.setAttribute("stroke-width", "4");
            circle.setAttribute("stroke-dasharray", `${dash} ${gapDash}`);
            circle.setAttribute(
              "stroke-dashoffset",
              `-${i * (circumference / total)}`
            );

            statusCircle.appendChild(circle);
          });

          statusImage.onclick = () => {
            currentStatus = 0;
            openStatusViewer();
          };
        }


        /* ==============================
            OPEN STATUS
        ============================== */

        function openStatusViewer() {

          if (!backendStatus || backendStatus.length === 0) return;

          currentStatus = 0;
          statusViewer.style.display = "flex";

          showStatus();
        }


        /* ==============================
            SHOW STATUS
        ============================== */

        function showStatus() {

          const s = backendStatus[currentStatus];
          if (!s) return;

          statusContent.innerHTML = "";

          // IMAGE
          if (s.type === "image") {

            const img = document.createElement("img");
            img.src = "/static/status/" + s.file;

            img.style.width = "100%";
            img.style.maxHeight = "70vh";
            img.style.objectFit = "contain";
            img.style.borderRadius = "10px";

            statusContent.appendChild(img);
          }

          // VIDEO
          else if (s.type === "video") {

            const video = document.createElement("video");
            video.src = "/static/status/" + s.file;
            video.autoplay = true;
            video.controls = true;

            video.style.width = "100%";
            video.style.maxHeight = "70vh";
            video.style.objectFit = "contain";
            video.style.borderRadius = "10px";

            statusContent.appendChild(video);
          }

          // TIME
          const timeDiv = document.createElement("div");
          timeDiv.style.marginTop = "10px";
          timeDiv.style.fontSize = "14px";
          timeDiv.style.opacity = "0.8";
          timeDiv.innerText = timeAgo(s.created_at);

          statusContent.appendChild(timeDiv);

          markViewed(currentStatus);

          statusTimer = setTimeout(() => {
            nextStatus();
          }, 5000);
        }


        /* ==============================
            TIME AGO
        ============================== */

        function timeAgo(time) {

          const now = new Date();
          const past = new Date(time.replace(" ", "T"));

          const seconds = Math.floor((now - past) / 1000);
          const minutes = Math.floor(seconds / 60);
          const hours = Math.floor(seconds / 3600);

          if (seconds < 10) return "just now";
          if (seconds < 60) return seconds + " sec ago";
          if (minutes < 60) return minutes + " min ago";
          if (hours < 24) return hours + " hours ago";

          return "1 day ago";
        }


        /* ==============================
            NEXT / PREVIOUS STATUS
        ============================== */

        function nextStatus() {

          clearTimeout(statusTimer);
          currentStatus++;

          if (currentStatus < backendStatus.length) {
            showStatus();
          } else {
            closeStatus();
          }
        }

        function prevStatus() {

          clearTimeout(statusTimer);
          currentStatus--;

          if (currentStatus >= 0) {
            showStatus();
          } else {
            currentStatus = 0;
          }
        }


        /* ==============================
            CLICK SKIP
        ============================== */

        statusViewer.addEventListener("click", (e) => {

          const width = statusViewer.clientWidth;
          const clickX = e.clientX;

          if (clickX > width / 2) {
            nextStatus();
          } else {
            prevStatus();
          }
        });


        /* ==============================
            CLOSE STATUS
        ============================== */

        function closeStatus() {
          statusViewer.style.display = "none";
          currentStatus = 0;
        }


        /* ==============================
            MARK VIEWED
        ============================== */

        function markViewed(index) {

          if (!statusCircle.children[index]) return;

          statusCircle.children[index].setAttribute("stroke", "#ccc");
        }


        /* ==============================
            STATUS UPLOAD
        ============================== */

        function uploadStatus(file) {

          if (!file) return;

          const formData = new FormData();
          formData.append("status", file);

          fetch("/upload_status", {
            method: "POST",
            body: formData
          })
            .then(res => res.json())
            .then(data => {

              if (data.success) {
                backendStatus.unshift(data.status);
                renderStatus();
                alert("Status uploaded successfully!");
              } else {
                alert("Upload failed");
              }
            })
            .catch(() => alert("Upload error"));
        }

        statusUploadBtn.addEventListener("click", function () {

          if (statusFile.files.length === 0) {
            alert("Please select a file first!");
            return;
          }

          uploadStatus(statusFile.files[0]);
          statusFile.value = "";
        });


        /* ==============================
            CHAT AUTO SCROLL
        ============================== */

        function scrollChatToBottom() {
          const chatBox = document.getElementById("chatBox");
          chatBox.scrollTop = chatBox.scrollHeight;
        }

        scrollChatToBottom();


        /* ==============================
            VOICE TO TEXT
        ============================== */

        const voiceBtn = document.getElementById("voiceBtn");
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {

          const recognition = new SpeechRecognition();

          recognition.onresult = e => {
            document.getElementById("messageInput").value =
              e.results[0][0].transcript;
          };

          voiceBtn.onclick = () => recognition.start();
        }


              /* ==============================
                  AUDIO RECORD
              ============================== */



        let audioChunks = [];
        let recordBtn = document.getElementById("recordBtn");
        let recordingBar = document.getElementById("recordingBar");
        let recordTime = document.getElementById("recordTime");

        let sendAudio = document.getElementById("sendAudio");
        let deleteAudio = document.getElementById("deleteAudio");
        let cancelRecord = document.getElementById("cancelRecord");

        let canvas = document.getElementById("waveCanvas");
        let canvasCtx = canvas.getContext("2d");

        let recording = false;
        let timer;
        let seconds = 0;

        let mediaRecorder;
        let analyser;
        let dataArray;
        let audioContext;

        let recordedBlob = null;


        /* HOLD START */
        recordBtn.addEventListener("mousedown", startRecording);
        recordBtn.addEventListener("touchstart", startRecording);

        /* RELEASE STOP */
        recordBtn.addEventListener("mouseup", stopRecording);
        recordBtn.addEventListener("mouseleave", stopRecording);
        recordBtn.addEventListener("touchend", stopRecording);


        async function startRecording(){

        if(recording) return;

        recording=true;

        recordingBar.style.display="flex";

        sendAudio.style.display="none";
        deleteAudio.style.display="none";

        seconds=0;

        timer=setInterval(()=>{

        seconds++;

        let m=Math.floor(seconds/60);
        let s=seconds%60;

        recordTime.innerText=m+":"+(s<10?"0"+s:s);

        },1000);


        let stream = await navigator.mediaDevices.getUserMedia({audio:true});

        audioContext=new AudioContext();

        let source=audioContext.createMediaStreamSource(stream);

        analyser=audioContext.createAnalyser();
        analyser.fftSize=256;

        source.connect(analyser);

        let bufferLength=analyser.frequencyBinCount;
        dataArray=new Uint8Array(bufferLength);

        drawWave();

        mediaRecorder=new MediaRecorder(stream);
        mediaRecorder.start();

        audioChunks=[];

        mediaRecorder.ondataavailable=e=>{
        audioChunks.push(e.data);
        };

        mediaRecorder.onstop=()=>{

        clearInterval(timer);

        recordedBlob=new Blob(audioChunks,{type:"audio/webm"});

        sendAudio.style.display="inline-block";
        deleteAudio.style.display="inline-block";

        };

        }



        function drawWave(){

        if(!recording) return;

        requestAnimationFrame(drawWave);

        analyser.getByteFrequencyData(dataArray);

        canvasCtx.clearRect(0,0,canvas.width,canvas.height);

        let barWidth=(canvas.width/dataArray.length)*2;
        let x=0;

        for(let i=0;i<dataArray.length;i++){

        let barHeight=dataArray[i]/2;

        canvasCtx.fillStyle="#25D366";

        canvasCtx.fillRect(x,canvas.height-barHeight,barWidth,barHeight);

        x+=barWidth+1;

        }

        }



        function stopRecording(){

        if(!recording) return;

        recording=false;

        if(mediaRecorder){
        mediaRecorder.stop();
        }

        }



        /* SEND AUDIO */

        sendAudio.onclick=function(){

        if(!recordedBlob) return;

        const formData=new FormData();
        formData.append("audio",recordedBlob,"voice.webm");

        fetch("",{
        method:"POST",
        body:formData
        }).then(()=>location.reload());

        };



        /* DELETE AUDIO */

        deleteAudio.onclick=function(){

        recordedBlob=null;
        audioChunks=[];

        recordingBar.style.display="none";

        };



        /* CANCEL RECORD */

        cancelRecord.onclick=function(){

        recording=false;

        clearInterval(timer);

        if(mediaRecorder){
        mediaRecorder.stop();
        }

        audioChunks=[];
        recordedBlob=null;

        recordingBar.style.display="none";

        };


        /* ==============================
            VIDEO RECORD
        ============================== */

        let videoRecorder;
        let videoChunks = [];
        const recordVideoBtn = document.getElementById("recordVideoBtn");
        const videoPreview = document.getElementById("videoPreview");
        const videoPreviewBox = document.getElementById("videoPreviewBox");

        let stream;

        function recordVideo() {

          if (recordVideoBtn.dataset.recording) {

            videoRecorder.stop();
            stream.getTracks().forEach(track => track.stop());

            videoPreviewBox.style.display = "none";
            recordVideoBtn.dataset.recording = "";

          } else {

            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
              .then(s => {

                stream = s;

                videoPreview.srcObject = stream;
                videoPreviewBox.style.display = "block";

                videoRecorder = new MediaRecorder(stream);
                videoRecorder.start();

                videoChunks = [];

                videoRecorder.ondataavailable = e =>
                  videoChunks.push(e.data);

                videoRecorder.onstop = () => {

                  const blob = new Blob(videoChunks, { type: "video/webm" });

                  const formData = new FormData();
                  formData.append("video", blob, "video.webm");

                  fetch("", {
                    method: "POST",
                    body: formData
                  }).then(() => location.reload());
                };

                recordVideoBtn.dataset.recording = true;
              });
          }
        }

        recordVideoBtn.onclick = recordVideo;


        /* ==============================
            INITIALIZE
        ============================== */

        renderStatus();

      });
      const socket = io();

      let localStream;
      let peerConnection;

      const dialTone = document.getElementById("dialTone");

      const ringtone = new Audio(
        "https://www.soundjay.com/telephone/sounds/telephone-ring-01a.mp3",
      );

      ringtone.loop = true;

      const servers = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      };

      // OPEN MODAL

      function showCallModal(id) {
        const modal = document.getElementById(id);

        if (modal) {
          modal.style.display = "flex";
        }
      }

      // CLOSE MODAL

      function closeCallModal(id) {
        const modal = document.getElementById(id);

        if (modal) {
          modal.style.display = "none";
        }
      }

      // START AUDIO CALL

      async function startAudioCall() {
        showCallModal("audioCallModal");

        document.getElementById("callStatus").innerText = "Calling...";

        dialTone.play();

        localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        createPeer();

        socket.emit("start_audio_call");
      }

      // START VIDEO CALL

      async function startVideoCall() {
        showCallModal("videoCallModal");

        document.getElementById("callStatusVideo").innerText = "Calling...";

        dialTone.play();

        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        document.getElementById("localVideo").srcObject = localStream;

        createPeer();

        socket.emit("start_video_call");
      }

      // CREATE WEBRTC

      function createPeer() {
        peerConnection = new RTCPeerConnection(servers);

        localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStream);
        });

        peerConnection.ontrack = (event) => {
          const remoteVideo = document.getElementById("remoteVideo");

          if (remoteVideo) {
            remoteVideo.srcObject = event.streams[0];
            remoteVideo.play();
          }
        };

        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("webrtc_ice", {
              candidate: event.candidate,
            });
          }
        };

        peerConnection.createOffer().then((offer) => {
          peerConnection.setLocalDescription(offer);

          socket.emit("webrtc_offer", { offer: offer });
        });
      }

      // INCOMING AUDIO CALL

      socket.on("incoming_audio_call", function () {
        dialTone.pause();
        dialTone.currentTime = 0;

        ringtone.play();

        showCallModal("audioCallModal");

        document.getElementById("callStatus").innerText = "Incoming Call";
      });

      // INCOMING VIDEO CALL

      socket.on("incoming_video_call", function () {
        dialTone.pause();
        dialTone.currentTime = 0;

        ringtone.play();

        showCallModal("videoCallModal");

        document.getElementById("callStatusVideo").innerText =
          "Incoming Video Call";
      });

      // ACCEPT AUDIO CALL

      document.getElementById("acceptAudioCall").onclick = async function () {
        ringtone.pause();
        dialTone.pause();

        ringtone.currentTime = 0;
        dialTone.currentTime = 0;

        localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        createPeer();

        document.getElementById("callStatus").innerText = "Connected";
      };

      // ACCEPT VIDEO CALL

      document.getElementById("acceptVideoCall").onclick = async function () {
        ringtone.pause();
        dialTone.pause();

        ringtone.currentTime = 0;
        dialTone.currentTime = 0;

        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        document.getElementById("localVideo").srcObject = localStream;

        createPeer();

        document.getElementById("callStatusVideo").innerText = "Connected";
      };

      // RECEIVE OFFER

      socket.on("webrtc_offer", async (data) => {
        if (!peerConnection) {
          peerConnection = new RTCPeerConnection(servers);
        }

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.offer),
        );

        const answer = await peerConnection.createAnswer();

        await peerConnection.setLocalDescription(answer);

        socket.emit("webrtc_answer", { answer: answer });
      });

      // RECEIVE ANSWER

      socket.on("webrtc_answer", async (data) => {
        if (peerConnection) {
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.answer),
          );
        }
      });

      // RECEIVE ICE

      socket.on("webrtc_ice", async (data) => {
        if (peerConnection) {
          await peerConnection.addIceCandidate(
            new RTCIceCandidate(data.candidate),
          );
        }
      });

      // STOP CALL

      function stopCall() {
        dialTone.pause();
        ringtone.pause();

        dialTone.currentTime = 0;
        ringtone.currentTime = 0;

        if (localStream) {
          localStream.getTracks().forEach((track) => track.stop());
        }

        if (peerConnection) {
          peerConnection.close();
          peerConnection = null;
        }

        closeCallModal("audioCallModal");
        closeCallModal("videoCallModal");
      }

      document.getElementById("endAudioCallBtn").onclick = stopCall;
      document.getElementById("endVideoCallBtn").onclick = stopCall;


      const emojiBtn = document.getElementById("emojiBtn");
      const emojiPicker = document.getElementById("emojiPicker");
      const messageInput = document.getElementById("messageInput");

      if (emojiBtn) {
        const picker = new EmojiMart.Picker({
          onEmojiSelect: (emoji) => {
            messageInput.value += emoji.native;
          },
        });

        emojiPicker.appendChild(picker);

        emojiBtn.onclick = () => {
          emojiPicker.style.display =
            emojiPicker.style.display === "none" ? "block" : "none";
        };
      }
      let replyId = null;

      const replyPreview = document.getElementById("replyPreview");
      const replyPreviewText = document.getElementById("replyPreviewText");
      const replyIdInput = document.getElementById("replyId");

      document.querySelectorAll(".replyBtn").forEach((btn) => {
        btn.onclick = function () {
          replyId = this.dataset.id;

          replyPreviewText.innerText = this.dataset.text;

          replyPreview.style.display = "block";

          replyIdInput.value = replyId;
        };
      });

      function cancelReply() {
        replyPreview.style.display = "none";

        replyPreviewText.innerText = "";

        replyIdInput.value = "";

        replyId = null;
      }

      function scrollToMsg(id) {
        const msg = document.getElementById("msg" + id);

        if (msg) {
          msg.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          msg.style.background = "#ffffcc";

          setTimeout(() => {
            msg.style.background = "";
          }, 2000);
        }
      }

      function reactMessage(msgId, emoji) {
        fetch("/react_message", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            message_id: msgId,
            emoji: emoji,
          }),
        })
          .then((res) => res.json())

          .then((data) => {
            if (data.success) {
              const box = document.getElementById("reaction" + msgId);

              box.innerHTML = "";

              if (data.reaction) {
                const span = document.createElement("span");

                span.className = "reaction";

                span.innerText = data.reaction;

                box.appendChild(span);
              }
            }
          });
      }
      document.addEventListener("click", function (e) {
        // REACT BUTTON CLICK
        if (e.target.classList.contains("reactBtn")) {
          const id = e.target.dataset.id;
          const panel = document.getElementById("panel" + id);

          // toggle panel
          if (panel.style.display === "block") {
            panel.style.display = "none";
            return;
          }

          // close other panels
          document
            .querySelectorAll(".reactionPanel")
            .forEach((p) => (p.style.display = "none"));

          // empty panel
          panel.innerHTML = "";

          // set position near button
          const rect = e.target.getBoundingClientRect();
          panel.style.top = window.scrollY + 80 + "px"; // above button
          panel.style.left = window.scrollX + "px";
          panel.style.display = "block";

          // create picker
          const picker = new EmojiMart.Picker({
            onEmojiSelect: (emoji) => {
              addReaction(id, emoji.native);
              panel.style.display = "none";
            },
            theme: "light",
            showPreview: false,
            showSkinTones: false,
          });

          panel.appendChild(picker);
        } else {
          // click outside -> hide all panels
          document
            .querySelectorAll(".reactionPanel")
            .forEach((p) => (p.style.display = "none"));
        }
      });

      // Add reaction function (WhatsApp style multiple reactions)
      function addReaction(msgId, emoji) {
        fetch("/react_message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message_id: msgId, emoji: emoji }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              const box = document.getElementById("reaction" + msgId);
              box.innerHTML = ""; // clear existing reaction(s)

              // add new emoji
              if (data.reaction) {
                const span = document.createElement("span");
                span.className = "reaction";
                span.innerText = data.reaction;
                box.appendChild(span);
              }
            }
          });
      }
      document.querySelectorAll(".moreBtn").forEach((btn) => {
        btn.onclick = function (e) {
          e.stopPropagation(); // prevent document click
          const menu = this.nextElementSibling;
          document.querySelectorAll(".moreMenu").forEach((m) => {
            if (m !== menu) m.style.display = "none";
          });
          menu.style.display =
            menu.style.display === "block" ? "none" : "block";
        };
      });

      // hide menu on outside click
      document.addEventListener("click", () => {
        document
          .querySelectorAll(".moreMenu")
          .forEach((m) => (m.style.display = "none"));
      });

      // ----------------------------
      // DELETE MESSAGE FUNCTION
      // ----------------------------

      document.querySelectorAll(".deleteMenuBtn").forEach((btn) => {
        btn.onclick = function (e) {
          e.stopPropagation(); // prevent menu click from bubbling
          const id = this.dataset.id;

          fetch("/delete_message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message_id: id }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                const msgDiv = document.getElementById("msg" + id);

                // ✅ Mark message as deleted
                msgDiv.classList.add("deleted");

                // ✅ Hide message content & actions
                const content = msgDiv.querySelector(".msgContent");
                const actions = msgDiv.querySelector(".msgActions");
                if (content) content.style.display = "none";
                if (actions) actions.style.display = "none";

                // ✅ Show deletedText only (once)
                let deletedText = msgDiv.querySelector(".deletedText");
                if (!deletedText) {
                  deletedText = document.createElement("div");
                  deletedText.className = "deletedText";
                  deletedText.innerText = "This message was deleted";
                  msgDiv.appendChild(deletedText);
                }
              }
            })
            .catch((err) => console.error("Delete error:", err));
        };
      });

      // ----------------------------
      // REPLY MESSAGE FUNCTION
      // ----------------------------
      document.querySelectorAll(".replyMenuBtn").forEach((btn) => {
        btn.onclick = function (e) {
          e.stopPropagation(); // prevent menu click from bubbling
          const id = this.dataset.id;
          const text = this.dataset.text;

          // Show reply preview
          const replyPreview = document.getElementById("replyPreview");
          const replyPreviewText = document.getElementById("replyPreviewText");
          const replyIdInput = document.getElementById("replyId");

          replyPreview.style.display = "block";
          replyPreviewText.innerText = text;
          replyIdInput.value = id;
        };
      });

      // ----------------------------
      // CANCEL REPLY FUNCTION
      // ----------------------------
      function cancelReply() {
        const replyPreview = document.getElementById("replyPreview");
        const replyPreviewText = document.getElementById("replyPreviewText");
        const replyIdInput = document.getElementById("replyId");

        replyPreview.style.display = "none";
        replyPreviewText.innerText = "";
        replyIdInput.value = "";
      }
      const attachmentInput = document.getElementById("attachmentInput");
      const filePreview = document.getElementById("filePreview");
      const previewContent = document.getElementById("previewContent");

      if (attachmentInput) {
        attachmentInput.addEventListener("change", function () {
          const file = this.files[0];

          if (!file) return;

          const fileURL = URL.createObjectURL(file);

          previewContent.innerHTML = "";

          // IMAGE
          if (file.type.startsWith("image")) {
            previewContent.innerHTML = `
        <img src="${fileURL}" style="max-width:200px;border-radius:8px">
        `;
          }

          // VIDEO
          else if (file.type.startsWith("video")) {
            previewContent.innerHTML = `
        <video controls style="max-width:200px;border-radius:8px">
            <source src="${fileURL}">
        </video>
        `;
          }

          // AUDIO
          else if (file.type.startsWith("audio")) {
            previewContent.innerHTML = `
        <audio controls>
            <source src="${fileURL}">
        </audio>
        `;
          }

          // OTHER FILE
          else {
            previewContent.innerHTML = `📎 ${file.name}`;
          }
          filePreview.style.display = "block";
        });
      }

      // REMOVE ATTACHMENT
      function removeAttachment() {
        attachmentInput.value = "";
        previewContent.innerHTML = "";
        filePreview.style.display = "none";
      }

      // Create and append modal container (only once)
      const imgModal = document.createElement("div");
      imgModal.id = "imageModal";
      imgModal.style.cssText = `
  display: none;
  position: fixed;
  z-index: 3000;
  left: 0; top: 0;
  width: 100vw; height: 100vh;
  background: #000000; /* solid black background */
  justify-content: center;
  align-items: center;
`;
      imgModal.innerHTML = `
  <img id="modalImg" style="max-width: 90vw; max-height: 90vh; border-radius: 10px; box-shadow: 0 0 15px rgba(255,255,255,0.5); cursor: zoom-out;">
`;
      document.body.appendChild(imgModal);

      // When modal background or image is clicked, close modal
      imgModal.addEventListener("click", () => {
        imgModal.style.display = "none";
      });

      // Prevent modal image click from closing modal (optional)
      document.getElementById("modalImg").addEventListener("click", (e) => {
        e.stopPropagation();
      });

      // Add click event to all chat images to open modal
      document.querySelectorAll(".chat-image").forEach((img) => {
        img.style.cursor = "pointer";
        img.addEventListener("click", () => {
          const modalImg = document.getElementById("modalImg");
          modalImg.src = img.src;
          imgModal.style.display = "flex";
        });
      });

      // PROFILE VIEW + EDIT
      function viewProfile() {
        const imgSrc = document.getElementById("profileImg").src;

        // Create modal
        const modal = document.createElement("div");
        modal.id = "profileModal";
        modal.style.position = "fixed";
        modal.style.top = 0;
        modal.style.left = 0;
        modal.style.width = "100%";
        modal.style.height = "100%";
        modal.style.background = "rgba(0,0,0,0.8)";
        modal.style.display = "flex";
        modal.style.alignItems = "center";
        modal.style.justifyContent = "center";
        modal.style.zIndex = 2000;

        modal.innerHTML = `<div style="position: relative; display:inline-block;">
          <img src="${imgSrc}" style="
            width: 280px;
            height: 280px;
            border-radius: 50%;
            object-fit: cover;
            border: 4px solid white;
            box-shadow: 0 0 10px rgba(0,0,0,0.4);
          ">

          <div id="editProfileBtn" style="
            position: absolute;
            bottom: 20px;
            right: 20px;
            width: 45px;
            height: 45px;
            background: #25D366;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 20px;
            border: 3px solid white;
            box-shadow: 0 0 6px rgba(0,0,0,0.4);
          ">
            ✏️
          </div>

        </div>
        `;

        document.body.appendChild(modal);
        modal.addEventListener("click", function (e) {
          if (e.target === modal) modal.remove();
        });
        const editBtn = document.getElementById("editProfileBtn");
        const fileInput = document.getElementById("profileInput");
        editBtn.addEventListener("click", (e) => {
          e.stopPropagation(); // prevent closing modal
          fileInput.click();
        });

        fileInput.addEventListener("change", () => {
          const file = fileInput.files[0];
          if (!file) return;
          const formData = new FormData();
          formData.append("profile", file);
          fetch("/upload_profile", {
            method: "POST",
            body: formData,
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                // Update modal image + main profile image
                document.getElementById("profileImg").src = data.profile_url;
                modal.querySelector("img").src = data.profile_url;
              } else {
                alert(data.message || "Upload failed");
              }
            })
            .catch(() => alert("Upload error"));
        });
      }