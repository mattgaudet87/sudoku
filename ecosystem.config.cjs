module.exports = {
  apps: [
    {
      name: 'wolf-sudoku',
      script: 'npm',
      args: 'run dev',
      cwd: __dirname,
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
}
