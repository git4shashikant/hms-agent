import { useState, useEffect, useRef } from 'react';
import { PropTypes } from 'prop-types';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { Box, Container, Grid, Paper } from '@mui/material';
import error from "eslint-plugin-react/lib/util/error.js";
import Metrics from "./Metrics.jsx";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer } from 'recharts';

import {
  APP_SERVER_URL,
  MSG_TYPE_CONNECT,
  MSG_TYPE_DISCONNECT,
  SOCKET_DEST_ADD_IP,
  SOCKET_DEST_SEND_METRICS,
  SOCKET_DEST_PUBLIC,
  MSG_TYPE_METRICS } from "../Constants.jsx";

function Message({ ipAddress }) {

  Message.propTypes = {
    ipAddress: PropTypes.string.isRequired
  };

  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [messages, setMessages] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {

    const newClient = new Client({
      webSocketFactory: () => new SockJS(APP_SERVER_URL),

      onConnect: () => {
        const connectMessage = {
          ipAddress: ipAddress,
          timeStamp: Date.now(),
          type: MSG_TYPE_CONNECT
        };

        newClient.heartbeatIncoming=0;
        newClient.publish({ destination: SOCKET_DEST_ADD_IP, body: JSON.stringify(connectMessage) });
        console.log(connectMessage);
        newClient.subscribe(SOCKET_DEST_PUBLIC, message => {
          const newMessage = JSON.parse(message.body);
          console.log(newMessage);
        });

        setConnectionStatus('Connected');

        intervalRef.current = setInterval(() => {
          const cpuUsage = getCpuUsage();
          const metricsMessage = {
            ipAddress: ipAddress,
            timeStamp: Date.now(),
            cpuUtilInPercent: cpuUsage,
            type: MSG_TYPE_METRICS
          };

          setMessages(prevMessages => [...prevMessages, metricsMessage]);
          newClient.publish({ destination: SOCKET_DEST_SEND_METRICS, body: JSON.stringify(metricsMessage) });
        }, 2000);
      },

      onDisconnect: () => {
        if (newClient.connected) {
          const leaveMessage = {
            ipAddress: ipAddress,
            timeStamp: Date.now(),
            type: MSG_TYPE_DISCONNECT
          };
          newClient.publish({ destination: SOCKET_DEST_ADD_IP, body: JSON.stringify(leaveMessage) });
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
    return () => {
      newClient.deactivate();
    };
  }, []);

  const getCpuUsage = () => {
    return (Math.random() * 100).toFixed(2);
  };

  messages.slice(messages.length-99, messages.length-1)
  const chartData = messages.slice(messages.length-30, messages.length-1).map(m => ({
    cpuUtilInPercent: Number(m.cpuUtilInPercent),
    time: new Date(m.timeStamp).toLocaleTimeString()
  }));

  return (
      <Container>
        <h2>{ connectionStatus }: CPU Utilization (%)</h2>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{height: '600px', overflow: 'auto', width: '100%', border: 'solid 1px'}}>
              {[...messages].slice(messages.length-30, messages.length-1).reverse().map((message, index) => (
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