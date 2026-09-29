Set WshShell = CreateObject("WScript.Shell")
WScript.Sleep 40
If WScript.Arguments.Count > 0 Then
  Dim action
  action = LCase(WScript.Arguments(0))
  If action = "paste" Then
    WshShell.SendKeys "^v"
  ElseIf action = "undo" Then
    WshShell.SendKeys "^z"
  ElseIf action = "undopaste" Then
    WshShell.SendKeys "^z"
    WScript.Sleep 35
    WshShell.SendKeys "^v"
  Else
    WshShell.SendKeys "^c"
  End If
Else
  WshShell.SendKeys "^c"
End If
