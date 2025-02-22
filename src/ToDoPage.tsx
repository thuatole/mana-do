import React, {useEffect, useReducer, useRef, useState} from 'react';
import {RouteComponentProps} from 'react-router-dom';

import reducer, {initialState} from './store/reducer';
import {
    setTodos,
    createTodo,
    deleteTodo,
    toggleAllTodos,
    deleteAllTodos,
    updateTodo,
    UpdateTodoPayload,
} from './store/actions';
import Service from './service';
import {TodoStatus} from './models/todo';
import {isTodoCompleted} from './utils';
import {set as storageSet, todoDataName} from './utils/storage';
import ToDoItem from './components/todo-item';

type EnhanceTodoStatus = TodoStatus | 'ALL';


const ToDoPage = ({history}: RouteComponentProps) => {
    // prevent go to this page without authen
    const [{todos}, dispatch] = useReducer(reducer, initialState);
    const [showing, setShowing] = useState<EnhanceTodoStatus>('ALL');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(()=>{
        (async ()=>{
            const resp = await Service.getTodos();

            dispatch(setTodos(resp || []));
        })()
    }, [])

		useEffect(()=>{
			storageSet(todoDataName, todos.map(({editable, ...rest}) => rest));
		}, [todos])

    // save data to local storage
    const onCreateTodo = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        // must have value before submitting
        if (e.key === 'Enter' && inputRef.current && inputRef.current.value) {
            try {
                const resp = await Service.createTodo(inputRef.current.value);
                dispatch(createTodo(resp));
                inputRef.current.value = '';
            } catch (e) {
                if (e.response.status === 401) {
                    history.push('/')
                }
            }
        }
    }

    const onUpdateTodo = (updatePayload: UpdateTodoPayload) => {
        dispatch(updateTodo(updatePayload))
    }

    const onToggleAllTodo = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(toggleAllTodos(e.target.checked))
    }

    const onDeleteAllTodo = () => {
        dispatch(deleteAllTodos());
    }

    const showTodos = todos.filter((todo) => {
        switch (showing) {
            case TodoStatus.ACTIVE:
                return todo.status === TodoStatus.ACTIVE;
            case TodoStatus.COMPLETED:
                return todo.status === TodoStatus.COMPLETED;
            default:
                return true;
        }
    });

    // fix a bug check all not checked in Completed state
    const activeTodos = showTodos.reduce(function (accum, todo) {
        return isTodoCompleted(todo) ? accum : accum + 1;
    }, 0);

    return (
        <div className="ToDo__container">
            <div className="Todo__creation">
                <input
                    ref={inputRef}
                    className="Todo__input"
                    placeholder="What need to be done?"
                    onKeyDown={onCreateTodo}
                />
            </div>
            <div className="ToDo__list">
                {
                    showTodos.map(todo => {
                        return (
                            <ToDoItem
                              key={todo.id}
                              item={todo}
                              onChangeItem={onUpdateTodo}
                              onDeleteItem={(id: string) => dispatch(deleteTodo(id))}
                            />
                        );
                    })
                }
            </div>
            <div className="Todo__toolbar">
                {showTodos.length > 0 ?
                    <input
                        type="checkbox"
                        checked={activeTodos === 0}
                        onChange={onToggleAllTodo}
                    /> : <div/>
                }
                <div className="Todo__tabs">
                    <button className="Action__btn" onClick={()=>setShowing('ALL')}>
                        All
                    </button>
                    <button className="Action__btn" onClick={()=>setShowing(TodoStatus.ACTIVE)}>
                        Active
                    </button>
                    <button className="Action__btn" onClick={()=>setShowing(TodoStatus.COMPLETED)}>
                        Completed
                    </button>
                </div>
                <button className="Action__btn" onClick={onDeleteAllTodo}>
                    Clear all todos
                </button>
            </div>
        </div>
    );
};

export default ToDoPage;
