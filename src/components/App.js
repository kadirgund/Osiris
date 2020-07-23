import '../assets/css/App.css';
import React, { useEffect, useReducer } from 'react';
import { BrowserRouter as Router, Switch, Route, Link, Redirect } from 'react-router-dom';
import ReactDom from 'react-dom';
import { Pool } from 'pg';
import { PG_URI } from '../pgKeys';
import Generator from '../containers/Generator.jsx';
import UiLibrary from '../containers/UiLibrary.jsx';
import DetailPage from '../containers/DetailPage.jsx';
import BuildPage from '../containers/BuildPage.jsx';
import { Context } from '../context/MyProvider.js';
import { Storage } from 'aws-amplify';

const pool = new Pool({ connectionString: PG_URI });
function App() {
	const { globalState, dispatch } = React.useContext(Context);

	// if used in Library, go to individual detailPage; if used in BuildPage, update Top Container
	const onClick = (e) => {
		dispatch({
			type: 'uiLibrary_details',
			payload: e.target.id
		});
		props.history.push('/detailPage');
	};

	const handlePromises = (itemsFromDB) => {
		// itemsFromDB = database data.rows
		// map uiItemPromises => [Storage.get, Storage.get.... etc]
		const uiItemsPromises = itemsFromDB.map((obj) => {
			return Storage.get(`${obj.file_name}.jpg`);
		});
		Promise.all(uiItemsPromises).then((results) => {
			// results = [url, url, url, etc....]
			// combining itemsFromDB with their appropriate urls
			const updateUiItems = itemsFromDB.map((item, index) => {
				// item = {file_name, type, react_code, etc....}
				// adding key: url, value: results[index]
				item.url = results[index];
				return item;
			});

			dispatch({ type: 'add_uis', payload: updateUiItems });
		});
	};

	useEffect(() => {
		pool.query('SELECT * FROM individual_ui').then((data) => {
			handlePromises(data.rows);
		});
	}, []);

	return (
		<Context.Consumer>
			{({ globalState }) => (
				<Router>
					<div className="navbar">
						<img
							src="https://i.imgur.com/HM3EwJ5.jpg"
							className="logo"
							alt="osiris"
							width="180"
							height="180"
						/>
						<ul>
							<li>
								<Link to="/">UI Library</Link>
							</li>
							<li>
								<Link to="/generator">UI Generator</Link>
							</li>
							<li>
								<Link to="/buildpage">Build Page</Link>
							</li>
							{/* <li>
                <Link to="/detailPage">Detail Page</Link>
              </li> */}
						</ul>
					</div>
					<Switch>
						<Route exact path="/">
							<UiLibrary handleClick={onClick} buttonText='Details' />
						</Route>
						<Route exact path="/generator">
							<Generator />
						</Route>
						<Route exact path="/detailPage">
							<DetailPage />
						</Route>
						<Route exact path="/buildpage">
							<BuildPage />
						</Route>
						<Route render={() => <Redirect to="/" />} />
					</Switch>
				</Router>
			)}
		</Context.Consumer>
	);
}
export default App;
