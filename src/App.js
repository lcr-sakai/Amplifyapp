import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { withAuthenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css';
import { API, Storage } from 'aws-amplify';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';
import { I18n } from 'aws-amplify';
import { translations } from '@aws-amplify/ui-react';
import Moment from 'react-moment';
// import DeleteIcon from '@mui/icons-material/Delete';

I18n.putVocabularies(translations);
I18n.setLanguage('ja');

const initialFormState = { name: '', description: '', password: '', memo: '' }

function App({ signOut, user }) {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description || !formData.password || !formData.memo) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }
  
  return (
    <div className="App">
      <h1>My Notes App</h1>
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Note name"
        value={formData.name}
      />
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Note description"
        value={formData.description}
      />
      <input
        onChange={e => setFormData({ ...formData, 'password': e.target.value})}
        placeholder="Note password"
        value={formData.password}
      />
      <input
        onChange={e => setFormData({ ...formData, 'memo': e.target.value})}
        placeholder="Note memo"
        value={formData.memo}
      />
      <input
        type="file"
        onChange={onChange}
      />
      <button onClick={createNote}>Create Note</button>
      <div style={{marginBottom: 30}}>
        {
          notes.map(note => (
            <div key={note.id || note.name}>
              <h2>{note.name}</h2>
              <p>{note.description}</p>
              <p>{note.password}</p>
              <p>{note.memo}</p>
              <button onClick={() => deleteNote(note)}>Delete note</button>
              {
                note.image && <img src={note.image} style={{width: 400}} />
              }
              <p>作成日時：<Moment format="YYYY/MM/DD HH:mm">{note.createdAt}</Moment></p>
              <p>更新日時：<Moment format="YYYY/MM/DD HH:mm">{note.updatedAt}</Moment></p>
            </div>
          ))
        }
      </div>
      <img src={logo} className="App-logo" alt="logo" />
      <h1>Hello {user.username}</h1>
      <button onClick={signOut}>Sign out</button>
    </div>
  );
}

export default withAuthenticator(App);