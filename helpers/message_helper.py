
def success(message="Success", data=None, redirect_url=None):
    return {
        "status": True,
        "message": f"<span style='color:green'>{message}</span>",
        "data": data,
        "redirect": redirect_url   # 🔥 new parameter
    }

def error(message="Error"):
    return {
        "status": False,
        "message": f"<span style='color:red'>{message}</span>"
    }
    


        
    
