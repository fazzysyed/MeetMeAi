import React, { useRef, useEffect, useState } from "react";
import MeetingFooter from "../MeetingFooter/MeetingFooter.component";
import Participants from "../Participants/Participants.component";
import "./MainScreen.css";
import { connect } from "react-redux";
import { setMainStream, updateUser } from "../../store/actioncreator";
import firepadRef from "../../server/firebase";

const MainScreen = (props) => {
  const participantRef = useRef(props.participants);
  const [data, setData] = useState([]);
  const [showBox, setShowBox] = useState(false);

  const wordsRef = firepadRef.child("words");
  const onMicClick = (micEnabled) => {
    if (props.stream) {
      props.stream.getAudioTracks()[0].enabled = micEnabled;
      props.updateUser({ audio: micEnabled });
    }
  };
  const onVideoClick = (videoEnabled) => {
    if (props.stream) {
      props.stream.getVideoTracks()[0].enabled = videoEnabled;
      props.updateUser({ video: videoEnabled });
    }
  };

  useEffect(() => {
    // Reference to the "words" node in your Firebase Realtime Database

    // Listen for changes in the "words" node
    wordsRef.on("value", (snapshot) => {
      const wordsData = snapshot.val();

      if (wordsData) {
        // Convert the object of words into an array
        const wordsArray = Object.values(wordsData);

        // Update the state with the array of words

        setData(wordsArray);
      }
    });

    // Clean up the event listener when the component unmounts
    return () => {
      wordsRef.off("value");
    };
  }, []);

  useEffect(() => {
    participantRef.current = props.participants;
  }, [props.participants]);

  const updateStream = (stream) => {
    for (let key in participantRef.current) {
      const sender = participantRef.current[key];
      if (sender.currentUser) continue;
      const peerConnection = sender.peerConnection
        .getSenders()
        .find((s) => (s.track ? s.track.kind === "video" : false));
      peerConnection.replaceTrack(stream.getVideoTracks()[0]);
    }
    props.setMainStream(stream);
  };

  const onScreenShareEnd = async () => {
    const localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    localStream.getVideoTracks()[0].enabled = Object.values(
      props.currentUser
    )[0].video;

    updateStream(localStream);

    props.updateUser({ screen: false });
  };

  const onScreenClick = async () => {
    let mediaStream;
    if (navigator.getDisplayMedia) {
      mediaStream = await navigator.getDisplayMedia({ video: true });
    } else if (navigator.mediaDevices.getDisplayMedia) {
      mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
    } else {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { mediaSource: "screen" },
      });
    }

    mediaStream.getVideoTracks()[0].onended = onScreenShareEnd;

    updateStream(mediaStream);

    props.updateUser({ screen: true });
  };
  return (
    <div className="wrapper">
      <div style={{ display: "flex" }}>
        <div className="main-screen">
          <Participants />
        </div>

        {showBox && (
          <div className="read-box-container">
            <div className="read-box">
              <h2 style={{ marginBottom: 20, marginTop: 20, color: "#fff" }}>
                Summary
              </h2>

              {data.map((item, index) => (
                <>
                  {item.message ? (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        marginBottom: "10px",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "lightblue",
                          padding: "5px 10px",
                          borderRadius: "8px",
                          marginRight: "10px",
                          minWidth: "100px", // Adjust as needed
                        }}
                      >
                        <strong>{item.userName}</strong>
                      </div>
                      <div
                        style={{
                          backgroundColor: "lightgray",
                          padding: "5px 10px",
                          textAlign: "start",
                          width: 200,

                          borderRadius: "8px",
                          // Adjust as needed
                        }}
                      >
                        {item.message}
                      </div>
                    </div>
                  ) : null}
                </>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="footer">
        <MeetingFooter
          onShowWords={() => {
            setShowBox(!showBox);
          }}
          onScreenClick={onScreenClick}
          onMicClick={onMicClick}
          onVideoClick={onVideoClick}
        />
      </div>
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    stream: state.mainStream,
    participants: state.participants,
    currentUser: state.currentUser,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setMainStream: (stream) => dispatch(setMainStream(stream)),
    updateUser: (user) => dispatch(updateUser(user)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(MainScreen);
