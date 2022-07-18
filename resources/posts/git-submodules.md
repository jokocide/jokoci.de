---
template: detail
title: Organizing code with Git submodules, and avoiding some pitfalls
date: 2021-09-16
author: Jon Koenig
---
The [documentation](https://git-scm.com/book/en/v2/Git-Tools-Submodules) on this topic is a little intimidating at first glance. I was not able to find a quick start for this tool anywhere on the web, so here is an abridged introduction in my own words.

## Add a submodule to your project

Lets say you have two projects, **tornado** and **wind**. Both of these projects are their own Git repositories.

One day you find yourself working on **tornado** and you realize that it will be necessary to include **wind**
as a part of **tornado** when it comes time to package the software.

```pwsh
git submodule add https://github.com/you/wind
```

You've just cloned **wind**, and you should be able to see that in your current directory. If you want the submodule to exist 
in a different directory you can provide the path as the final argument. In this case, the submodule is cloned to **.\src\wind** 
instead of your current directory.

```pwsh
git submodule add https://github.com/you/wind .\src\wind
```

As you might expect, adding a submodule this way doesn't just clone the repository. It also scaffolds out a **.gitmodules**
file for you. This file contains the information that allows git to remember what submodules are associated
with this project, and where they are supposed to be located.

## Verify .gitmodules

It is always a good idea to review the **.gitmodules** file after this step, in certain cases the path key of the new entry
can be generated in a way that prevents git from correctly evaluating the path.

```pwsh
[submodule ".\src\wind"]
	path = .\src\wind
	url = https://github.com/you/wind
```

The path key shown above will not work, but this can easily be corrected.

```pwsh
[submodule ".\src\wind"]
	path = src/wind
	url = https://github.com/you/wind
```

I originally suspected this to be a Windows issue, but encountered the same problem on macOS later.

## Commit & push

Finish setting up this submodule by committing your changes. Run a **git status** and you should see something along these lines.

```pwsh
On branch master
Your branch is up-to-date with 'origin/master'.

Changes to be committed:
  (use "git reset HEAD <file>..." to unstage)

	new file:   .gitmodules
	new file:   src/wind
```

These two new files are version controlled just like the rest of your project, so go ahead and commit them.

```pwsh
 git commit -am 'Add wind submodule'
```

And don't forget to push the changes.

```pwsh
git push origin master
```

## Clone a project with submodules

Now, when you find yourself at a different machine and ready to work on project **tornado**, you might
start by cloning the project.

```pwsh
git clone https://github.com/you/tornado
```

You will quickly realize that while the src/wind directory does exist, it is empty. Two commands are available to help populate this 
directory with the actual contents of your submodule. The first one exists to initialize your configuration file.

```pwsh
git submodule init
```

The second command will read that initialized configuration file and actually do the work of pulling in the correct files.

```pwsh
git submodule update
```

You can combine those three steps into one by passing the --recurse-submodules flag to the clone command.

```pwsh
git clone --recurse-submodules https://github.com/you/tornado
```