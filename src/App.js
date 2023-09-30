import MainScreen from "./components/MainScreen/MainScreen.component";
import firepadRef, { db, userName } from "./server/firebase";
import "./App.css";
import { useEffect, useState } from "react";
import {
  setMainStream,
  addParticipant,
  setUser,
  removeParticipant,
  updateParticipant,
} from "./store/actioncreator";
import { connect } from "react-redux";
import { useSpeechRecognition } from "react-speech-kit";

import SpeechRecognition from "react-speech-recognition";

function App(props) {
  const getUserStream = async () => {
    const localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    return localStream;
  };

  const [value, setValue] = useState("");
  const [autoStopTimeout, setAutoStopTimeout] = useState(null);

  const onResult = (result) => {
    setValue(result);
  };

  const changeLang = (event) => {
    // setLang(event.target.value);
  };

  const onError = (event) => {
    if (event.error === "not-allowed") {
      // setBlocked(true);
    }
  };

  // const { listen, listening, stop, supported } = useSpeechRecognition({
  //   onResult,
  //   onEnd,
  //   onError,
  // });

  useEffect(async () => {
    const stream = await getUserStream();
    stream.getVideoTracks()[0].enabled = false;
    props.setMainStream(stream);

    // listen();

    connectedRef.on("value", (snap) => {
      if (snap.val()) {
        const defaultPreference = {
          audio: true,
          video: false,
          screen: false,
        };
        const userStatusRef = participantRef.push({
          userName,
          preferences: defaultPreference,
        });
        props.setUser({
          [userStatusRef.key]: { name: userName, ...defaultPreference },
        });
        userStatusRef.onDisconnect().remove();
      }
    });
  }, []);

  const connectedRef = db.database().ref(".info/connected");
  const participantRef = firepadRef.child("participants");
  const wordsRef = firepadRef.child("words");

  const isUserSet = !!props.user;
  const isStreamSet = !!props.stream;

  useEffect(() => {
    // Check if the browser supports the Web Speech API
    if (!("webkitSpeechRecognition" in window)) {
      console.error("Web Speech API is not supported in this browser.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();

    recognition.onstart = () => {};

    recognition.onend = () => {
      // Restart the recognition session
      recognition.start();
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;

      console.log(transcript);

      if (transcript.length) {
        var time = new Date();

        wordsRef.push({
          userName,
          message: transcript,
          time: time.toLocaleString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          }),
        });
      }

      // Push the speech data to your Firebase database
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);

      // Restart the recognition session after an error
      recognition.start();
    };

    recognition.lang = "en-US"; // Set the recognition language if needed

    recognition.start();

    return () => {
      recognition.stop();
    };
  }, []);

  useEffect(() => {
    if (isStreamSet && isUserSet) {
      participantRef.on("child_added", (snap) => {
        const preferenceUpdateEvent = participantRef
          .child(snap.key)
          .child("preferences");
        preferenceUpdateEvent.on("child_changed", (preferenceSnap) => {
          props.updateParticipant({
            [snap.key]: {
              [preferenceSnap.key]: preferenceSnap.val(),
            },
          });
        });
        const { userName: name, preferences = {} } = snap.val();
        props.addParticipant({
          [snap.key]: {
            name,
            ...preferences,
          },
        });
      });
      participantRef.on("child_removed", (snap) => {
        props.removeParticipant(snap.key);
      });
    }
  }, [isStreamSet, isUserSet]);

  return (
    // <div>
    //   <textarea
    //     value={value}
    //     onChange={(event) => setValue(event.target.value)}
    //   />
    //   <button onMouseDown={listen} onMouseUp={stop}>
    //     🎤
    //   </button>
    // </div>
    <div className="App">
      <MainScreen />
    </div>
  );
}

const mapStateToProps = (state) => {
  return {
    stream: state.mainStream,
    user: state.currentUser,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setMainStream: (stream) => dispatch(setMainStream(stream)),
    addParticipant: (user) => dispatch(addParticipant(user)),
    setUser: (user) => dispatch(setUser(user)),
    removeParticipant: (userId) => dispatch(removeParticipant(userId)),
    updateParticipant: (user) => dispatch(updateParticipant(user)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
