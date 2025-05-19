# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

Description: This app connects with the backend server via websocket and send the cpu utilization metrics. 

Steps to run locally:
$ npm install 
$ npm run dev

Access the page:
http://localhost:5173/

To build docker image:
$ docker build . -t "hms-agent:v1.0"
$ docker run -p 3000:3000 hms-agent:v1.0
Access the page:
http://localhost:3000/
