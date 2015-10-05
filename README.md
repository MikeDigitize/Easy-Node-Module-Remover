# Easy Node Module Remover
Remove Node Modules... Easily!

If you've ever felt the pain of being both a Windows user AND trying to delete a Node project, you'll know what a chore deleting that <code>node_modules</code> folder can be. Try and do it manually and you'll invariably run into issues as Windows doesn't like long file paths and won't let you delete the folder without a fight, or you can manually type each module name on the command line after <code>npm uninstall</code>, which is just... interminable.

Enter <code>Easy Node Module Remover</code>!

Pop it in your root directory, next to your <code>package.json</code> file and when the time comes, just run it from the terminal.

```unix
node module-remover
```

It will remove all dependencies listed in your <code>package.json</code> file under the following keys:
* dependencies
* devDependencies
* optionalDependencies
* bundledDependencies

No more module removing headaches! 

To remove modules from only specific parts of your <code>package.json</code> file, pass in the dependency types on the command line:
```unix
node module-remover optionalDependencies bundledDependencies
```

## Licence
MIT
