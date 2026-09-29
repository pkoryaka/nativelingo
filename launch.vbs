Set fso = CreateObject("Scripting.FileSystemObject")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = strPath

args = ""
If WScript.Arguments.Count > 0 Then
  For i = 0 To WScript.Arguments.Count - 1
    args = args & " """ & WScript.Arguments(i) & """"
  Next
End If

electronExe = strPath & "\node_modules\electron\dist\electron.exe"

If fso.FileExists(electronExe) Then
  cmdLine = "cmd /c """"" & electronExe & """ """ & strPath & """" & args & """"
  WshShell.Run cmdLine, 0, False
Else
  WshShell.Run "cmd /c npm start -- " & args, 0, False
End If

Set WshShell = Nothing
Set fso = Nothing
