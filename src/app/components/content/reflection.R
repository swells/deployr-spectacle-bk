reflection <- function (variable) { 
  getName (deparse(substitute(variable))) 
}

getName <- function (variable) {
  (variable)
}

reflection(x)