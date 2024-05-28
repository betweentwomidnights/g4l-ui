import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import fs from 'fs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faPause,
  faSyncAlt,
  faCut,
} from '@fortawesome/free-solid-svg-icons';
import icon from '../../assets/icon.png';
import './App.css';

interface RecordingData {
  toggle?: number; // Optional: for toggle message
  action?: string; // To distinguish different actions
  data?: string | number; // Base64 encoded audio data
}

function Hello() {
  const [isRecording, setIsRecording] = useState(false);
  const waveSurferRef = useRef<WaveSurfer | null>(null); // For the first waveform
  const waveSurferOutRef = useRef<WaveSurfer | null>(null); // For the second waveform
  const waveformRef = useRef<HTMLDivElement | null>(null); // Ref for the first waveform container
  const waveformOutRef = useRef<HTMLDivElement | null>(null); // Ref for the second waveform container
  const [modelPath, setModelPath] = useState(''); // State to hold the model path
  const [progress, setProgress] = useState(0);
  const [promptDuration, setPromptDuration] = useState(6); // Default value

  useEffect(() => {
    // Setup for the waveSurfer instances
    if (waveformRef.current) {
      waveSurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'red',
        progressColor: 'maroon',
        backend: 'MediaElement',
        interact: true,
        height: 50,
      });
    }
    if (waveformOutRef.current) {
      waveSurferOutRef.current = WaveSurfer.create({
        container: waveformOutRef.current,
        waveColor: 'red',
        progressColor: 'maroon',
        backend: 'MediaElement',
        interact: true,
        height: 50,
      });
    }
    return () => {
      waveSurferRef.current?.destroy();
      waveSurferOutRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    const handleData = (data: Uint8Array) => {
      const jsonStr = new TextDecoder().decode(data);
      try {
        const parsedData: RecordingData = JSON.parse(jsonStr);
        // Handle toggle specifically for recording state
        if (typeof parsedData.toggle === 'number') {
          if (parsedData.toggle === 0 || parsedData.toggle === 1) {
            setIsRecording(parsedData.toggle === 1);
          } else {
            // Assuming any other number is a progress update
            setProgress(parsedData.toggle);
          }
        }

        // Handle other actions like loading audio data
        if (parsedData.action && parsedData.data) {
          const dataURI = `data:audio/wav;base64,${parsedData.data as string}`;
          const ref =
            parsedData.action === 'audio_data_output'
              ? waveSurferOutRef
              : waveSurferRef;
          ref.current?.load(dataURI);
        }
      } catch (error) {
        console.error('Error parsing data:', error);
      }
    };

    window.api.receive('fromNodeScript', handleData);

    return () => {
      window.api.remove('fromNodeScript', handleData);
    };
  }, []);

  const sendToNodeScript = (payload: { action: string; data?: any }) => {
    window.api.send('send-to-node-script', payload);
  };

  const handleModelPathChange = (event: any) => {
    const newPath = event.target.value;
    console.log('New path: ', newPath); // Debugging log to check the input
    setModelPath(newPath); // Update state with new path
    // Debugging log to check state update
    console.log('Updated model path state to: ', newPath);

    // Send the new model path to the node.script immediately
    sendToNodeScript({ action: 'update_model_path', data: newPath });
    console.log('Sent model path update to node.script'); // Confirm sending action
  };

  const handlePromptDurationChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newDuration = parseInt(event.target.value, 10);
    setPromptDuration(newDuration);
    sendToNodeScript({ action: 'update_prompt_duration', data: newDuration });
  };

  const handleCropAudio = () => {
    if (waveSurferOutRef.current) {
      const end = waveSurferOutRef.current.getCurrentTime();
      sendToNodeScript({ action: 'crop', data: end });
    }
  };

  return (
    <div>
      <div className="logo">
        <img width="150" alt="icon" src={icon} />
      </div>
      <div className="indicator">
        {isRecording ? (
          <div className="recording-indicator" />
        ) : (
          <div className="idle-indicator" />
        )}
      </div>
      <button
        type="button"
        onClick={() => sendToNodeScript({ action: 'fix_toggle' })}
      >
        fix_toggle
      </button>
      <div>progress: {progress}%</div>
      <div ref={waveformRef} className="waveform" />
      <div ref={waveformOutRef} className="waveform-out" />
      <div className="Hello">
        <input
          type="text"
          value={modelPath}
          onChange={handleModelPathChange}
          placeholder="Enter Model Path"
          className="model-path-input"
        />
        <input
          type="number"
          value={promptDuration}
          min="1"
          max="15"
          onChange={handlePromptDurationChange}
          placeholder="Set Prompt Duration"
          className="prompt-duration-input"
        />
        <button
          type="button"
          onClick={() => sendToNodeScript({ action: 'play' })}
        >
          <FontAwesomeIcon icon={faPlay} />
        </button>
        <button
          type="button"
          onClick={() => sendToNodeScript({ action: 'pause' })}
        >
          <FontAwesomeIcon icon={faPause} />
        </button>
        <button
          type="button"
          onClick={() => sendToNodeScript({ action: 'reset' })}
        >
          <FontAwesomeIcon icon={faSyncAlt} />
        </button>
        <button
          type="button"
          onClick={() => sendToNodeScript({ action: 'bang' })}
        >
          bang
        </button>
        <button
          type="button"
          onClick={() => sendToNodeScript({ action: 'continue' })}
        >
          continue
        </button>
        <button
          type="button"
          onClick={() => sendToNodeScript({ action: 'retry' })}
        >
          retry
        </button>
        <button
          type="button"
          onClick={() => sendToNodeScript({ action: 'write_buffer' })}
        >
          save buffer
        </button>
        <button
          type="button"
          onClick={() => sendToNodeScript({ action: 'load_output' })}
        >
          load output
        </button>
        <button type="button" onClick={handleCropAudio}>
          <FontAwesomeIcon icon={faCut} />
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
