from dotenv import load_dotenv

load_dotenv()  # reads backend/.env into the environment, before the model is built

from typing import Annotated, TypedDict
from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages


class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]


from langchain_openai import ChatOpenAI

from app.tools import calculator, web_search

MODEL = "gpt-5.4-mini"
llm = ChatOpenAI(model=MODEL)

tools = [calculator, web_search]
llm = llm.bind_tools(tools)


def call_model(state: State) -> State:
    response = llm.invoke(state["messages"])
    return {"messages": [response]}


from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode, tools_condition

builder = StateGraph(State)
builder.add_node("llm", call_model)
builder.add_node("tools", ToolNode(tools))
builder.add_edge(START, "llm")
builder.add_conditional_edges("llm", tools_condition)
builder.add_edge("tools", "llm")
graph = builder.compile()
