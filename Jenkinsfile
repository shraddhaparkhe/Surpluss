def runNpm(String command) {
  if (isUnix()) {
    sh "npm ${command}"
  } else {
    bat "npm ${command}"
  }
}

pipeline {
  agent any

  options {
    timestamps()
    timeout(time: 30, unit: 'MINUTES')
  }

  environment {
    CI = 'true'
  }

  stages {
    stage('Install dependencies') {
      steps {
        script {
          runNpm('ci')
        }
      }
    }

    stage('Typecheck') {
      steps {
        script {
          runNpm('run typecheck')
        }
      }
    }

    stage('Lint') {
      steps {
        script {
          runNpm('run lint')
        }
      }
    }

    stage('Unit tests') {
      steps {
        script {
          runNpm('test')
        }
      }
    }

    stage('Build') {
      steps {
        script {
          runNpm('run build')
        }
      }
    }

    stage('Install Chromium') {
      steps {
        script {
          runNpm('exec playwright install chromium')
        }
      }
    }

    stage('End-to-end tests') {
      steps {
        script {
          runNpm('run test:e2e')
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'test-results/**,playwright-report/**', allowEmptyArchive: true
    }
  }
}