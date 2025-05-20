import {useState, useEffect, useRef} from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import {Box, Container} from '@mui/material';
import PropTypes from 'prop-types';
import error from "eslint-plugin-react/lib/util/error.js";
import Metrics from "./Metrics.jsx";

function Message({ ipAddress }) {
  Message.propTypes = {
    ipAddress: PropTypes.string.isRequired
  };

  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [messages, setMessages] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    const newClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8000/ws'),
      onConnect: () => {
        const connectMessage = {
          ipAddress: ipAddress,
          timeStamp: Date.now(),
          type: 'CONNECT'
        };
        newClient.heartbeatIncoming=0;
        newClient.publish({ destination: '/app/message.add-ip', body: JSON.stringify(connectMessage) });
        console.log(connectMessage);
        newClient.subscribe('/topic/public', message => {
          const newMessage = JSON.parse(message.body);
          console.log("Connect Message: " + JSON.stringify(newMessage));
        });
        setConnectionStatus('Connected');

        intervalRef.current = setInterval(() => {
          const cpuUsage = getCpuUsage();
          const metricsMessage = {
            ipAddress: ipAddress,
            timeStamp: Date.now(),
            cpuUtilInPercent: cpuUsage,
            type: 'METRICS'
          };

          setMessages(prevMessages => [...prevMessages, metricsMessage]); // Add the received message to the state
          newClient.publish({ destination: '/app/message.send-metrics', body: JSON.stringify(metricsMessage) });
        }, 2000);
      },
      onDisconnect: () => {
        if (newClient.connected) { // Check if the client is connected
          const leaveMessage = {
            ipAddress: ipAddress,
            timeStamp: Date.now(),
            type: 'DISCONNECT'
          };
          newClient.publish({ destination: '/app/message.add-ip', body: JSON.stringify(leaveMessage) });
          console.log(leaveMessage); // Log the leave message
        }
        setConnectionStatus('Disconnected');
        if (intervalRef.current) clearInterval(intervalRef.current);
      },
      onWebSocketClose: () => {
        setConnectionStatus('Disconnected');
        if (intervalRef.current) clearInterval(intervalRef.current);
      },
      onWebSocketError: () => {
        console.error('WebSocket error: ', error);
        setConnectionStatus('Failed to connect');
      },
      onStompError: (frame) => {
        console.log('Broker reported error: ' + frame.headers['message']);
        console.log('Additional details: ' + frame.body);
      },
    });

    newClient.activate();

    // Disconnect when the component unmounts
    return () => {
      newClient.deactivate();
    };
  }, []);

  const getCpuUsage = () => {
    // This should be replaced with real CPU usage if available
    return (Math.random() * 100).toFixed(2);
  };

  return (
    <Container>
      <h2>{ connectionStatus }: CPU Utilization (%)</h2>
      <Box sx={{height: '600px', overflow: 'auto', width: '100%', border: 'solid 1px'}}>
        {messages.map((message, index) => (
            <Metrics key={index} message={message}/>
        ))}
      </Box>
    </Container>
  );
}

export default Message;