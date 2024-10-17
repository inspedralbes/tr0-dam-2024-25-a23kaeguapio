<template>
  <div class="app-container">
    <h3>CRUD Questions</h3>

    <button class="mostrar-formulario-boton" @click="toggleForm">
      {{ showAddForm ? 'Cancelar' : 'Afegir Pregunta' }}
    </button>
    <div class="layout">
      <div class="questions-list">
        <div v-for="(pregunta, index) in preguntas" :key="index" class="pregunta-section">
          <div class="pregunta-container">
            <label>Pregunta {{ index + 1 }}: </label>
            <span v-if="!pregunta.isEditing" class="question-text">{{ pregunta.pregunta }}</span>
            <input
              v-if="pregunta.isEditing"
              v-model="pregunta.pregunta"
              class="edit-question-input"
            />
          </div>

          <div class="opciones-grid">
            <div
              v-for="(respuesta, answerIndex) in pregunta.respuestas"
              :key="answerIndex"
              class="opcion-container"
            >
              <img
                :src="respuesta.imatge"
                alt="Imatge de la resposta"
                class="opcion-imagen"
              />
              <div v-if="!pregunta.isEditing && pregunta.correctAnswerIndex === answerIndex" class="correct-answer-indicator">
                <span class="check-icon">✔️</span>
              </div>
              <input
                v-if="pregunta.isEditing"
                v-model="respuesta.imatge"
                :placeholder="`URL imatge resposta ${answerIndex + 1}`"
                required
              />
              <div class="opcion-radio" v-if="pregunta.isEditing">
                <input
                  type="radio"
                  name="correctAnswer"
                  :value="answerIndex"
                  v-model="pregunta.correctAnswerIndex"
                />
                <span>Correcta</span>
              </div>
            </div>
          </div>

          <div class="question-actions">
            <button class="editar-boton" @click.prevent="editQuestion(index)">
              {{ pregunta.isEditing ? 'Guardar' : 'Editar' }}
            </button>
            <button class="eliminar-boton" @click.prevent="deleteQuestion(index)">
              Eliminar Pregunta
            </button>
          </div>
        </div>
      </div>

      <div v-if="showAddForm" class="nuevo-container">
        <h4>Afegir Pregunta</h4>
        <form @submit.prevent="addQuestion">
          <label>Pregunta:</label>
          <input
            v-model="newQuestionText"
            placeholder="Text de la Pregunta"
            required
            class="new-question-input"
          />

          <label>Imatge de la Resposta</label>
          <div v-for="(answer, index) in newAnswers" :key="index" class="opcion-container">
            <input
              v-model="newAnswers[index].imatge"
              :placeholder="`URL imatge resposta ${index + 1}`"
              required
            />
            <div class="opcion-radio">
              <input
                type="radio"
                name="newCorrectAnswer"
                :value="index"
                v-model="newSelectedCorrectAnswer"
              />
              <span>Correcta</span>
            </div>
          </div>
          <button type="submit" class="boton">Afegir Pregunta</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      preguntas: [],
      newQuestionText: '',
      newAnswers: [
        { imatge: '' },
        { imatge: '' },
        { imatge: '' },
        { imatge: '' },
      ],
      newSelectedCorrectAnswer: null,
      showAddForm: false,
    };
  },
  created() {
    this.fetchQuestions();
  },
  methods: {
    // Función para mezclar respuestas
    shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    },

    // Cargar preguntas del backend
    async fetchQuestions() {
      try {
        const response = await fetch('http://dam.inspedralbes.cat:22222/preguntas');
        const data = await response.json();
        this.preguntas = data.preguntes.map((pregunta) => {
          const allAnswers = [
            { imatge: pregunta.resposta_correcta.imatge },
            ...pregunta.respostes_incorrectes.map((respuesta) => ({ imatge: respuesta.imatge }))
          ];

          // Mezclar las respuestas
          const shuffledAnswers = this.shuffleArray(allAnswers);
          const correctAnswerIndex = shuffledAnswers.findIndex(
            (respuesta) => respuesta.imatge === pregunta.resposta_correcta.imatge
          );

          return {
            pregunta: pregunta.pregunta,
            respuestas: shuffledAnswers,
            correctAnswerIndex: correctAnswerIndex,
            isEditing: false,
          };
        });
      } catch (error) {
        console.error('Error al cargar las preguntas:', error);
      }
    },

    // Añadir una nueva pregunta
    async addQuestion() {
      const newQuestion = {
        pregunta: this.newQuestionText,
        resposta_correcta: { imatge: this.newAnswers[this.newSelectedCorrectAnswer].imatge },
        respostes_incorrectes: this.newAnswers.filter((_, index) => index !== this.newSelectedCorrectAnswer),
      };

      const allAnswers = [...this.newAnswers]; // Se mantiene el orden original
      const shuffledAnswers = this.shuffleArray(allAnswers);
      const correctAnswerIndex = shuffledAnswers.findIndex(
        (respuesta) => respuesta.imatge === newQuestion.resposta_correcta.imatge
      );

      newQuestion.correctAnswerIndex = correctAnswerIndex;

      try {
        const response = await fetch('http://dam.inspedralbes.cat:22222/preguntas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newQuestion),
        });
        if (response.ok) {
          this.preguntas.push({
            pregunta: this.newQuestionText,
            respuestas: shuffledAnswers,
            correctAnswerIndex: correctAnswerIndex,
            isEditing: false,
          });
          this.resetNewQuestionForm();
          this.toggleForm(); // Cerrar el formulario tras añadir la pregunta
        } else {
          console.error('Error al añadir la pregunta:', await response.json());
        }
      } catch (error) {
        console.error('Error en la solicitud POST:', error);
      }
    },

    // Eliminar una pregunta
    async deleteQuestion(index) {
      try {
        const response = await fetch(`http://dam.inspedralbes.cat:22222/preguntas/${index}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          this.preguntas.splice(index, 1);
        } else {
          console.error('Error al eliminar la pregunta:', await response.json());
        }
      } catch (error) {
        console.error('Error en la solicitud DELETE:', error);
      }
    },

    // Editar una pregunta
    async editQuestion(index) {
      const pregunta = this.preguntas[index];
      if (pregunta.isEditing) {
        const updatedQuestion = {
          pregunta: pregunta.pregunta,
          resposta_correcta: { imatge: pregunta.respuestas[pregunta.correctAnswerIndex].imatge },
          respostes_incorrectes: pregunta.respuestas.filter((_, i) => i !== pregunta.correctAnswerIndex),
        };

        updatedQuestion.correctAnswerIndex = pregunta.correctAnswerIndex; // Mantener el índice correcto

        try {
          const response = await fetch(`http://dam.inspedralbes.cat:22222/preguntas/${index}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedQuestion),
          });
          if (response.ok) {
            pregunta.isEditing = false; // Salir del modo de edición
          } else {
            console.error('Error al actualizar la pregunta:', await response.json());
          }
        } catch (error) {
          console.error('Error en la solicitud PUT:', error);
        }
      } else {
        pregunta.isEditing = true; // Entrar en modo de edición
      }
    },

    toggleForm() {
      this.showAddForm = !this.showAddForm;
    },

    resetNewQuestionForm() {
      this.newQuestionText = '';
      this.newAnswers = [
        { imatge: '' },
        { imatge: '' },
        { imatge: '' },
        { imatge: '' },
      ];
      this.newSelectedCorrectAnswer = null;
    },
  },
};
</script>

<style scoped>
.app-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  text-align: left;
}

.layout {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.questions-list {
  width: 100%;
}

.pregunta-section {
  margin-bottom: 20px;
  border: 2px solid #ccc;
  padding: 10px;
  border-radius: 8px;
}

.pregunta-container {
  text-align: center;
}

.opciones-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  justify-items: center;
  align-items: center;
  margin-top: 20px;
}

.opcion-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 150px;
}

.opcion-imagen {
  width: 120px;
  height: 120px;
  display: block;
  margin: 0 auto;
  border-radius: 8px;
}

.eliminar-boton,
.editar-boton {
  margin: 10px 5px;
  padding: 10px;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  display: block;
  width: 100px;
  text-align: center;
}

.eliminar-boton {
  background-color: #8b306d;
}

.editar-boton {
  background-color: #20188f;
}

.question-actions {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.mostrar-formulario-boton {
  background-color: #20188f;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 5px;
}

.nuevo-container {
  width: 50%;
  margin-left: 20px;
  border: 1px solid #ccc;
  padding: 20px;
  border-radius: 8px;
}

.new-question-input {
  width: 100%;
  margin-bottom: 20px;
  padding: 10px;
  border-radius: 8px;
}

.boton {
  background-color: #575555;
  margin: 10px 5px;
  padding: 10px;
  color: white;
  border: none;
  border-radius: 5px;
}
</style>
