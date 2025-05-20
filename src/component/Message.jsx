import {useState, useEffect, useRef} from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import {Box, Container, Grid, Paper} from '@mui/material';
import PropTypes from 'prop-types';
import error from "eslint-plugin-react/lib/util/error.js";
import Metrics from "./Metrics.jsx";
// Chart imports
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

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

  // Prepare chart data (parse numbers and format timestamp)
  const chartData = messages.map(m => ({
    cpuUtilInPercent: Number(m.cpuUtilInPercent),
    // Format timestamp as hh:mm:ss for readability
    time: new Date(m.timeStamp).toLocaleTimeString()
  }));

  return (
      <Container>
        <h2>{ connectionStatus }: CPU Utilization (%)</h2>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{height: '600px', overflow: 'auto', width: '100%', border: 'solid 1px'}}>
              {[...messages].reverse().map((message, index) => (
                  <Metrics key={index} message={message}/>
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{height: '600px', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" minTickGap={20} />
                  <YAxis domain={[0, 100]} label={{ value: 'CPU %', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="cpuUtilInPercent" stroke="#8884d8" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </Container>
  );
}

export default Message;