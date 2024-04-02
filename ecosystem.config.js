module.exports = {
    apps : [{
      name: 'server',
      script: './bin/www2',
        ignore_watch	: ["./node_modules","public" ],
        env_development: {
        NODE_ENV: "production"
      },
      instances : "max",
      exec_mode : "cluster"
    }]
  };
  