
      const statusCircle = document.getElementById("statusCircle");
      const statusImage = document.getElementById("statusImage");
      const statusFile = document.getElementById("statusFile");
      const statusUploadBtn = document.getElementById("statusUploadBtn");
      const statusViewer = document.getElementById("statusViewer");
      const statusContent = document.getElementById("statusContent");

      let backendStatus = {{ status|tojson if status else '[]' }};
      let currentStatus = 0;


      // STATUS RENDER
      function renderStatus(){

statusCircle.innerHTML="";

if(!backendStatus || backendStatus.length===0){

statusImage.style.display="none";
statusCircle.style.display="none";
return;

}

statusImage.style.display="block";
statusCircle.style.display="block";

const latestStatus = backendStatus[0];

statusImage.src="/static/status/"+latestStatus.file;

const radius=30;
const cx=35,cy=35;

const total=backendStatus.length;

const gap=4;

const circumference=2*Math.PI*radius;

backendStatus.forEach((s,i)=>{

const segmentAngle=360/total;

const dash=((segmentAngle-gap)/360)*circumference;

const gapDash=circumference;

const circle=document.createElementNS("http://www.w3.org/2000/svg","circle");

circle.setAttribute("r",radius);
circle.setAttribute("cx",cx);
circle.setAttribute("cy",cy);
circle.setAttribute("fill","none");
circle.setAttribute("stroke","#25d366");
circle.setAttribute("stroke-width","4");

circle.setAttribute("stroke-dasharray",`${dash} ${gapDash}`);

circle.setAttribute("stroke-dashoffset",`-${i*(circumference/total)}`);

statusCircle.appendChild(circle);

});

statusImage.onclick=()=>{

currentStatus=0;

openStatusViewer();

};

}



// OPEN STATUS

function openStatusViewer(){

statusViewer.style.display="flex";

showStatus();

}



// SHOW STATUS

function showStatus(){

statusContent.innerHTML="";

const s=backendStatus[currentStatus];

if(!s) return;

if(s.type==="image"){

const img=document.createElement("img");

img.src="/static/status/"+s.file;

statusContent.appendChild(img);

}

else if(s.type==="video"){

const vid=document.createElement("video");

vid.src="/static/status/"+s.file;

vid.autoplay=true;

vid.controls=true;

statusContent.appendChild(vid);

}


markViewed(currentStatus);


// AUTO NEXT

statusTimer=setTimeout(()=>{

nextStatus();

},5000);

}



// NEXT STATUS

function nextStatus(){
clearTimeout(statusTimer);
currentStatus++;
if(currentStatus<backendStatus.length){
showStatus();
}else{
closeStatus();
}
}



// PREVIOUS STATUS

function prevStatus(){

clearTimeout(statusTimer);

currentStatus--;

if(currentStatus>=0){

showStatus();

}else{

currentStatus=0;

}

}



// CLICK SKIP

statusViewer.addEventListener("click",(e)=>{

const width=statusViewer.clientWidth;

const clickX=e.clientX;

if(clickX > width/2){

nextStatus();

}else{

prevStatus();

}

});



// CLOSE STATUS

function closeStatus(){

statusViewer.style.display="none";

currentStatus=0;

}



// MARK VIEWED

function markViewed(index){

if(!statusCircle.children[index]) return;

statusCircle.children[index].setAttribute("stroke","#ccc");

}


      // UPLOAD STATUS
      function uploadStatus(file){

      if(!file) return;

      const formData=new FormData();

      formData.append("status",file);

      fetch("/upload_status",{method:"POST",body:formData})

      .then(res=>res.json())

      .then(data=>{

      if(data.success){

      backendStatus.unshift(data.status);

      renderStatus();

      alert("Status uploaded successfully!");

      }

      else{

      alert("Upload failed");

      }

      })

      .catch(err=>alert("Upload error"));

      }


      statusUploadBtn.addEventListener("click",function(){

      if(statusFile.files.length===0){

      alert("Please select a file first!");

      return;

      }

      uploadStatus(statusFile.files[0]);

      statusFile.value="";

      });


      // CHAT AUTO SCROLL
      function scrollChatToBottom(){

      const chatBox=document.getElementById("chatBox");

      chatBox.scrollTop=chatBox.scrollHeight;

      }

      scrollChatToBottom();


      // VOICE TO TEXT
      const voiceBtn=document.getElementById("voiceBtn");

      const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;

      if(SpeechRecognition){

      const recognition=new SpeechRecognition();

      recognition.onresult=e=>{

      document.getElementById("messageInput").value=e.results[0][0].transcript;

      };

      voiceBtn.onclick=()=>recognition.start();

      }


      // AUDIO RECORD
      let mediaRecorder,audioChunks=[];

      const recordBtn=document.getElementById("recordBtn");

      function recordAudio(){

      if(recordBtn.dataset.recording){

      mediaRecorder.stop();

      recordBtn.dataset.recording="";

      }

      else{

      navigator.mediaDevices.getUserMedia({audio:true})

      .then(stream=>{

      mediaRecorder=new MediaRecorder(stream);

      mediaRecorder.start();

      audioChunks=[];

      mediaRecorder.ondataavailable=e=>audioChunks.push(e.data);

      mediaRecorder.onstop=()=>{

      const blob=new Blob(audioChunks,{type:"audio/webm"});

      const formData=new FormData();

      formData.append("audio",blob,"voice.webm");

      fetch("",{method:"POST",body:formData})

      .then(()=>location.reload());

      };

      recordBtn.dataset.recording=true;

      });

      }

      }

      recordBtn.onclick=recordAudio;


      // VIDEO RECORD
      let videoRecorder, videoChunks=[];
const recordVideoBtn=document.getElementById("recordVideoBtn");
const videoPreview=document.getElementById("videoPreview");
const videoPreviewBox=document.getElementById("videoPreviewBox");

let stream;

function recordVideo(){

if(recordVideoBtn.dataset.recording){

videoRecorder.stop();
stream.getTracks().forEach(track=>track.stop());

videoPreviewBox.style.display="none";

recordVideoBtn.dataset.recording="";

}

else{

navigator.mediaDevices.getUserMedia({video:true,audio:true})
.then(s=>{

stream=s;

videoPreview.srcObject=stream;

videoPreviewBox.style.display="block";

videoRecorder=new MediaRecorder(stream);

videoRecorder.start();

videoChunks=[];

videoRecorder.ondataavailable=e=>videoChunks.push(e.data);

videoRecorder.onstop=()=>{

const blob=new Blob(videoChunks,{type:"video/webm"});

const formData=new FormData();

formData.append("video",blob,"video.webm");

fetch("",{method:"POST",body:formData})
.then(()=>location.reload());

};

recordVideoBtn.dataset.recording=true;

});

}

}

recordVideoBtn.onclick=recordVideo;


      // ATTACHMENT PREVIEW (WHATSAPP STYLE)
      const attachmentInput=document.getElementById("attachmentInput");

      const previewBox=document.getElementById("filePreview");

      const previewContent=document.getElementById("previewContent");

      if(attachmentInput){

      attachmentInput.onchange=function(){

      const file=this.files[0];

      if(!file) return;

      previewBox.style.display="block";

      const ext=file.name.split('.').pop().toLowerCase();

      previewContent.innerHTML="";


      // IMAGE
      if(["jpg","jpeg","png","gif","webp"].includes(ext)){

      const img=document.createElement("img");

      img.src=URL.createObjectURL(file);

      img.style.maxWidth="200px";

      img.style.borderRadius="8px";

      previewContent.appendChild(img);

      }


      // VIDEO
      else if(["mp4","webm"].includes(ext)){

      const video=document.createElement("video");

      video.src=URL.createObjectURL(file);

      video.controls=true;

      video.style.maxWidth="200px";

      previewContent.appendChild(video);

      }


      // OTHER FILE
      else{

      previewContent.innerHTML="📎 "+file.name;

      }

      }

      }


      // REMOVE ATTACHMENT
      function removeAttachment(){

      attachmentInput.value="";

      previewBox.style.display="none";

      previewContent.innerHTML="";

      }


      renderStatus();